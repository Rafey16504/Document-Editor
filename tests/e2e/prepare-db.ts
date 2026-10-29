// Recreates the e2e database from scratch: schema via drizzle-kit, then the demo users.
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (url !== "file:e2e.db") {
  throw new Error(`Refusing to reset ${url}; expected file:e2e.db`);
}

for (const suffix of ["", "-wal", "-shm", "-journal"]) {
  rmSync(`e2e.db${suffix}`, { force: true });
}
execSync("npx drizzle-kit push --force", { stdio: "inherit" });
execSync("npx tsx src/server/db/seed.ts", { stdio: "inherit" });
