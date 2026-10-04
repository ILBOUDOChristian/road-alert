import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../auth/enums/user-role.enum';
import { UserStatus } from '../auth/enums/user-status.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(query: UserQueryDto) {
    const { page = 1, limit = 10, role, status, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.userRepo.createQueryBuilder('user');

    if (role) {
      qb.andWhere('user.role = :role', { role });
    }

    if (status) {
      qb.andWhere('user.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await qb
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: users.map(u => this.excludePassword(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return this.excludePassword(user) as User;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (dto.phone && dto.phone !== user.phone) {
      const existingPhone = await this.userRepo.findOne({ where: { phone: dto.phone } });
      if (existingPhone) {
        throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
      }
    }

    Object.assign(user, dto);
    const updated = await this.userRepo.save(user);
    return this.excludePassword(updated) as User;
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'password'], 
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new ForbiddenException('Ancien mot de passe incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(user);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    user.role = role;
    const updated = await this.userRepo.save(user);
    return this.excludePassword(updated) as User;
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    user.status = status;
    const updated = await this.userRepo.save(user);
    return this.excludePassword(updated) as User;
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    
    user.status = UserStatus.INACTIVE;
    await this.userRepo.save(user);
  }

  private excludePassword(user: User): Partial<User> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
