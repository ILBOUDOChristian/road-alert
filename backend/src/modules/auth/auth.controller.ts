import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Créer un compte',
    description:
      'Enregistre un nouveau compte citoyen. Retourne un access token et un refresh token. Limité à 5 tentatives par minute par IP.',
  })
  @ApiResponse({ status: 201, type: TokenResponseDto, description: 'Compte créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  @ApiResponse({ status: 429, description: 'Trop de requêtes' })
  async register(@Body() dto: RegisterDto): Promise<TokenResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Se connecter',
    description:
      'Authentifie un utilisateur par email et mot de passe. Retourne un access token (15 min) et un refresh token (7 jours). Limité à 5 tentatives par minute par IP.',
  })
  @ApiResponse({ status: 200, type: TokenResponseDto, description: 'Connexion réussie' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe invalide' })
  @ApiResponse({ status: 429, description: 'Trop de requêtes' })
  async login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renouveler le token d\'accès',
    description:
      'Échange un refresh token valide contre un nouveau pair access/refresh token. L\'ancien refresh token est révoqué (rotation).',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, type: TokenResponseDto, description: 'Tokens renouvelés' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Se déconnecter',
    description: 'Révoque le refresh token fourni. Nécessite un access token valide.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 204, description: 'Déconnexion réussie' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async logout(
    @CurrentUser() user: User,
    @Body() dto: RefreshTokenDto,
  ): Promise<void> {
    return this.authService.logout(user.id, dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Profil courant',
    description: 'Retourne le profil de l\'utilisateur authentifié. Le mot de passe n\'est jamais inclus.',
  })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  getMe(@CurrentUser() user: User) {
    return this.authService.getProfile(user);
  }
}
