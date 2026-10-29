import { asc, eq } from "drizzle-orm";
import { db } from "./db/client";
import { users, type User } from "./db/schema";

export async function listUsers(): Promise<User[]> {
  return db.select().from(users).orderBy(asc(users.name));
}

export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}
