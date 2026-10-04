import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../auth/enums/user-role.enum';
import { UserStatus } from '../auth/enums/user-status.enum';

const baseUser: User = {
  id: 'user-id-123',
  email: 'test@example.com',
  phone: null,
  password: 'hashed-password',
  firstName: 'Jean',
  lastName: 'Dupont',
  role: UserRole.CITIZEN,
  status: UserStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  refreshTokens: [],
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findOne', () => {
    it('lève NotFoundException si l\'utilisateur n\'existe pas', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('inconnu')).rejects.toThrow(NotFoundException);
    });

    it('retourne le profil sans mot de passe', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);
      const result = await service.findOne('user-id-123');
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(baseUser.email);
    });
  });

  describe('update', () => {
    it('lève NotFoundException si l\'utilisateur n\'existe pas', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.update('inconnu', {})).rejects.toThrow(NotFoundException);
    });

    it('lève ConflictException si le téléphone est déjà pris', async () => {
      userRepo.findOne
        .mockResolvedValueOnce(baseUser) // Le findOne pour récupérer le user
        .mockResolvedValueOnce({ id: 'autre-id' }); // Le findOne pour vérifier le tel

      await expect(
        service.update('user-id-123', { phone: '+22900000000' }),
      ).rejects.toThrow(ConflictException);
    });

    it('met à jour et retourne le profil', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);
      userRepo.save.mockResolvedValue({ ...baseUser, firstName: 'Pierre' });

      const result = await service.update('user-id-123', { firstName: 'Pierre' });
      expect(userRepo.save).toHaveBeenCalled();
      expect(result.firstName).toBe('Pierre');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('changePassword', () => {
    it('lève ForbiddenException si l\'ancien mot de passe est faux', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, password: 'old-hash' });
      
      // On mock bcrypt.compare pour qu'il retourne false
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(
        service.changePassword('user-id-123', {
          oldPassword: 'wrong-password',
          newPassword: 'new-password',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('change le mot de passe avec succès', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, password: 'old-hash' });
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'new-hash');

      await service.changePassword('user-id-123', {
        oldPassword: 'correct-password',
        newPassword: 'new-password',
      });

      expect(userRepo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('passe le statut à INACTIVE', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);
      await service.remove('user-id-123');
      
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: UserStatus.INACTIVE })
      );
    });
  });
});
