import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'jean.dupont@example.com',
    description: 'Adresse email unique du compte',
  })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({
    example: 'MonMotDePasse1!',
    description: 'Mot de passe (8 caractères minimum)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'Jean', description: 'Prénom' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Dupont', description: 'Nom de famille' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({
    example: '+22901234567',
    description: 'Numéro de téléphone (optionnel)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,30}$/, {
    message: 'Numéro de téléphone invalide',
  })
  phone?: string;
}
