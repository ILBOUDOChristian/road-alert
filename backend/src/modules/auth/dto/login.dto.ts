import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'jean.dupont@example.com',
    description: 'Email ou numéro de téléphone du compte',
  })
  @IsString()
  @IsNotEmpty({ message: 'L\'identifiant est requis' })
  @MaxLength(255)
  identifier: string;

  @ApiProperty({
    example: 'MonMotDePasse1!',
    description: 'Mot de passe du compte',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;
}
