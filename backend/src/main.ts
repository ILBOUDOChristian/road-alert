import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('RoadAlert API')
    .setDescription('The RoadAlert API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: false });

  await app.listen(port);
}
bootstrap();
