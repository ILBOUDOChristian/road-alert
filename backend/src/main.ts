import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { isAllowedOrigin } from './config/cors.origins';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigins = configService.get<string>(
    'corsOrigins',
    'http://localhost:*',
  );
  const port = configService.get<number>('port', 3000);
  const apiPrefix = configService.get<string>('apiPrefix', 'api/v1');

  // JWT is loaded at boot so auth modules can inject ConfigService later.
  configService.getOrThrow<string>('jwtSecret');

  app.enableCors({
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin, corsOrigins));
    },
  });
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('RoadAlert API')
    .setDescription(
      'API REST de gestion des signalements routiers.\n\n' +
      '**Authentification** : Bearer JWT — obtenez un token via `POST /api/v1/auth/login`.\n\n' +
      '**Rate limiting** : 100 req/min par défaut, 5 req/min sur les routes de connexion.'
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addServer(`http://localhost:${port}`, 'Développement local')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: false,
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port);
}
bootstrap();
