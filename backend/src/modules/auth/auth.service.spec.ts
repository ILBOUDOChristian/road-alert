import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';

const baseUser: User = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  email: 'test@example.com',
  phone: null,
  password: '',
  firstName: 'Jean',
  lastName: 'Dupont',
  role: UserRole.CITIZEN,
  status: UserStatus.ACTIVE,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  refreshTokens: [],
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Record<string, jest.Mock>;
  let refreshTokenRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    refreshTokenRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshTokenRepo },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-access-token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('lève ConflictException si email déjà pris', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'pass1234!',
          firstName: 'Jean',
          lastName: 'Dupont',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('crée un utilisateur et retourne des tokens', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({ ...baseUser });
      userRepo.save.mockResolvedValue({ ...baseUser });
      refreshTokenRepo.create.mockReturnValue({});
      refreshTokenRepo.save.mockResolvedValue({});

      const result = await service.register({
        email: 'nouveau@example.com',
        password: 'pass1234!',
        firstName: 'Jean',
        lastName: 'Dupont',
      });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.tokenType).toBe('Bearer');
    });
  });

  describe('login', () => {
    it('lève UnauthorizedException si identifiant inconnu', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.login({ identifier: 'inconnu@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si mot de passe incorrect', async () => {
      const hash = await bcrypt.hash('correct', 1);
      userRepo.findOne.mockResolvedValue({ ...baseUser, password: hash });
      await expect(
        service.login({ identifier: 'test@example.com', password: 'mauvais' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si compte suspendu', async () => {
      const hash = await bcrypt.hash('pass1234!', 1);
      userRepo.findOne.mockResolvedValue({
        ...baseUser,
        password: hash,
        status: UserStatus.SUSPENDED,
      });
      await expect(
        service.login({ identifier: 'test@example.com', password: 'pass1234!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('retourne des tokens avec email valide', async () => {
      const hash = await bcrypt.hash('pass1234!', 1);
      userRepo.findOne.mockResolvedValue({ ...baseUser, password: hash });
      refreshTokenRepo.create.mockReturnValue({});
      refreshTokenRepo.save.mockResolvedValue({});

      const result = await service.login({
        identifier: 'test@example.com',
        password: 'pass1234!',
      });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('retourne des tokens avec numéro de téléphone valide', async () => {
      const hash = await bcrypt.hash('pass1234!', 1);
      userRepo.findOne.mockResolvedValue({ ...baseUser, phone: '+22901234567', password: hash });
      refreshTokenRepo.create.mockReturnValue({});
      refreshTokenRepo.save.mockResolvedValue({});

      const result = await service.login({
        identifier: '+22901234567',
        password: 'pass1234!',
      });

      expect(result.accessToken).toBe('mock-access-token');
    });
  });

  describe('getProfile', () => {
    it('ne retourne pas le mot de passe', () => {
      const profile = service.getProfile({ ...baseUser, password: 'hash-secret' });
      expect(profile).not.toHaveProperty('password');
    });

    it('retourne les champs attendus', () => {
      const profile = service.getProfile(baseUser);
      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('email');
      expect(profile).toHaveProperty('role');
      expect(profile).toHaveProperty('status');
      expect(profile).not.toHaveProperty('refreshTokens');
    });

    it('formate les dates en français', () => {
      const profile = service.getProfile(baseUser);
      expect(typeof profile.createdAt).toBe('string');
      expect(typeof profile.updatedAt).toBe('string');
      expect(profile.createdAt).toMatch(/\d{4}/);
    });
  });

  describe('logout', () => {
    it('ne lève pas d\'erreur si le token est vide', async () => {
      await expect(service.logout('user-id', '')).resolves.toBeUndefined();
    });
  });
});
