export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!ADMIN_EMAIL) {
  throw new Error("ADMIN_EMAIL env var is not set");
}
