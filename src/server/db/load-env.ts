// For scripts that run outside Next (seed, drizzle-kit): load .env.local the
// same way `next dev` does. Import this before anything that reads env vars.
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
