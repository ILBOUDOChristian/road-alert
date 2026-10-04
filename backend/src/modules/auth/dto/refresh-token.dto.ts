import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de rafraîchissement obtenu lors du login ou du refresh précédent',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le refresh token est requis' })
  refreshToken: string;
}
