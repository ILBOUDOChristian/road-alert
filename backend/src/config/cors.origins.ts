export function isAllowedOrigin(
  origin: string | undefined,
  corsOrigins: string,
): boolean {
  if (!origin) {
    return true;
  }

  const allowed = corsOrigins
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return allowed.some((pattern) => {
    if (pattern.endsWith(':*')) {
      const prefix = pattern.slice(0, -2);
      return origin === prefix || origin.startsWith(`${prefix}:`);
    }
    return origin === pattern;
  });
}
