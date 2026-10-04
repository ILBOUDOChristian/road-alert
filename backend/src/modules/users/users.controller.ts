import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../auth/enums/user-role.enum';

@ApiTags('Utilisateurs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Lister les utilisateurs (ADMIN)',
    description: 'Retourne une liste paginée et filtrée des utilisateurs. Réservé aux administrateurs.',
  })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Voir un profil',
    description: 'Voir les détails d\'un utilisateur. Un utilisateur normal ne peut voir que son propre profil.',
  })
  @ApiResponse({ status: 200, description: 'Profil trouvé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    this.checkOwnershipOrAdmin(id, currentUser);
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un profil',
    description: 'Modifier prénom, nom, téléphone. Un utilisateur normal ne peut modifier que son propre profil.',
  })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    this.checkOwnershipOrAdmin(id, currentUser);
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/password')
  @ApiOperation({
    summary: 'Changer le mot de passe',
    description: 'Nécessite l\'ancien mot de passe.',
  })
  @ApiResponse({ status: 200, description: 'Mot de passe modifié' })
  changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
    @CurrentUser() currentUser: User,
  ) {
    this.checkOwnershipOrAdmin(id, currentUser);
    return this.usersService.changePassword(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Désactiver un compte',
    description: 'Passe le statut du compte à INACTIVE. Soft delete.',
  })
  @ApiResponse({ status: 200, description: 'Compte désactivé' })
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    this.checkOwnershipOrAdmin(id, currentUser);
    return this.usersService.remove(id);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Changer le rôle d\'un utilisateur (ADMIN)',
  })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Changer le statut d\'un compte (ADMIN)',
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.usersService.updateStatus(id, dto.status);
  }

  /**
   * Vérifie que l'utilisateur courant a le droit d'agir sur l'ID spécifié.
   * L'action est autorisée si l'utilisateur est ADMIN, ou s'il agit sur son propre compte.
   */
  private checkOwnershipOrAdmin(targetId: string, currentUser: User) {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== targetId) {
      throw new ForbiddenException(
        'Vous n\'avez pas les droits pour modifier ou consulter ce profil',
      );
    }
  }
}
