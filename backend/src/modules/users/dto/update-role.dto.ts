import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../auth/enums/user-role.enum';

export class UpdateRoleDto {
  @ApiProperty({
    enum: UserRole,
    description: 'Nouveau rôle à assigner',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
