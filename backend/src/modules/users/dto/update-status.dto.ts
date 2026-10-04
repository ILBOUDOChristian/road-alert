import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '../../auth/enums/user-status.enum';

export class UpdateStatusDto {
  @ApiProperty({
    enum: UserStatus,
    description: 'Nouveau statut du compte',
  })
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}
