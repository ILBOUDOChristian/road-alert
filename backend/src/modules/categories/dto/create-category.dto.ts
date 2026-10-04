import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, Matches, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Nid de poule', description: 'Nom de la catégorie (unique)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Trou dans la chaussée', description: 'Description optionnelle' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#FF5733', description: 'Code couleur Hexadécimal' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'La couleur doit être un code hexadécimal valide (ex: #FF0000)',
  })
  color?: string;

  @ApiPropertyOptional({ example: true, description: 'Catégorie active ou non', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
