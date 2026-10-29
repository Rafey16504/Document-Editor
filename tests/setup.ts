import { pushSQLiteSchema } from "drizzle-kit/api";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";

// Build the schema from schema.ts so tests never drift from what db:push applies.
const { apply } = await pushSQLiteSchema(schema, db);
await apply();
