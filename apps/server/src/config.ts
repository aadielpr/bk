export const config = {
  // Connection URLs come from the environment, set by the operator. No fallback credentials.
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: requiredEnv("DATABASE_URL"),
  redisUrl: process.env.REDIS_URL,
  jwtSecret: requiredEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
  superAdminUsername: process.env.SUPER_ADMIN_USERNAME ?? "",
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD ?? "",
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}
