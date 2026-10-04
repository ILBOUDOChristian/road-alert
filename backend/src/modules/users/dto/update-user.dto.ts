import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Jean',
    description: 'Nouveau prénom',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Dupont',
    description: 'Nouveau nom de famille',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    example: '+22901234567',
    description: 'Nouveau numéro de téléphone',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
