import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

const mockCategory: Category = {
  id: 'cat-123',
  name: 'Nid de poule',
  description: 'Trou dans la chaussée',
  color: '#FF0000',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('devrait créer une catégorie', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue(mockCategory);
    repo.save.mockResolvedValue(mockCategory);

    const result = await service.create({ name: 'Nid de poule' });
    expect(repo.save).toHaveBeenCalled();
    expect(result.name).toBe('Nid de poule');
  });

  it('devrait lever ConflictException si le nom existe déjà à la création', async () => {
    repo.findOne.mockResolvedValue(mockCategory);

    await expect(service.create({ name: 'Nid de poule' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('devrait retourner toutes les catégories actives', async () => {
    repo.find.mockResolvedValue([mockCategory]);
    const result = await service.findAll();
    
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
    expect(result.length).toBe(1);
  });

  it('devrait lever NotFoundException pour un ID inconnu', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('inconnu')).rejects.toThrow(NotFoundException);
  });

  it('devrait mettre à jour une catégorie', async () => {
    repo.findOne
      .mockResolvedValueOnce(mockCategory) // pour le findOne initial
      .mockResolvedValueOnce(null); // pour vérifier l'unicité du nom

    repo.save.mockResolvedValue({ ...mockCategory, name: 'Autre nom' });

    const result = await service.update('cat-123', { name: 'Autre nom' });
    expect(result.name).toBe('Autre nom');
  });

  it('devrait désactiver une catégorie', async () => {
    repo.findOne.mockResolvedValue(mockCategory);
    
    await service.remove('cat-123');
    
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });
});
