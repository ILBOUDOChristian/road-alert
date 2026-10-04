export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiUrl: process.env.API_URL ?? 'http://roadalert.com/api/v1',
  appUrl: process.env.APP_URL ?? 'http://roadalert.com',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigins: process.env.CORS_ORIGINS ?? 'http://localhost:*',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-dev-only',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
});
