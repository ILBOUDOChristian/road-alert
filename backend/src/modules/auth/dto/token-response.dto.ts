import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT d\'accès à courte durée de vie (15 min par défaut)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token de rafraîchissement opaque (7 jours)',
    example: 'a3f8b2c1d4e5f6...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Type de token — toujours Bearer',
    example: 'Bearer',
  })
  tokenType: string;
}
