import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { UserStatus } from './enums/user-status.enum';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenResponseDto> {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = this.userRepo.create({
      email: dto.email,
      phone: dto.phone ?? null,
      password: passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    const saved = await this.userRepo.save(user);
    return this.issueTokens(saved);
  }

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.userRepo.findOne({
      where: [
        { email: dto.identifier },
        { phone: dto.identifier },
      ],
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Compte désactivé ou suspendu');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    return this.issueTokens(user);
  }

  async refresh(rawToken: string): Promise<TokenResponseDto> {
    if (!rawToken) {
      throw new UnauthorizedException('Token de rafraîchissement manquant');
    }

    const tokenHash = this.hash(rawToken);

    const record = await this.refreshTokenRepo.findOne({
      where: { tokenHash, revoked: false },
      relations: ['user'],
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de rafraîchissement invalide ou expiré');
    }

    if (record.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Compte désactivé ou suspendu');
    }

    record.revoked = true;
    await this.refreshTokenRepo.save(record);

    return this.issueTokens(record.user);
  }

  async logout(userId: string, rawToken: string): Promise<void> {
    if (!rawToken) return;

    const tokenHash = this.hash(rawToken);

    await this.refreshTokenRepo.update(
      { userId, tokenHash, revoked: false },
      { revoked: true },
    );
  }

  getProfile(user: User) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      createdAt: this.formatDate(user.createdAt),
      updatedAt: this.formatDate(user.updatedAt),
    };
  }

  private formatDate(date: Date): string {
    if (!date) return null;
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Porto-Novo',
    });
  }

  private async issueTokens(user: User): Promise<TokenResponseDto> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const raw = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hash(raw);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    const record = this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });
    await this.refreshTokenRepo.save(record);

    return { accessToken, refreshToken: raw, tokenType: 'Bearer' };
  }

  private hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}
