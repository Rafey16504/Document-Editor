import { db } from "@/server/db/client";
import { documentShares, users, type ShareRole } from "@/server/db/schema";
import { createDocument } from "@/server/documents";

let counter = 0;

export async function createUser(name = "User") {
  counter += 1;
  const [user] = await db
    .insert(users)
    .values({ name, email: `${name.toLowerCase()}${counter}@test.dev` })
    .returning();
  return user;
}

export async function createDoc(ownerId: string, title = "Doc") {
  return createDocument(ownerId, {
    title,
    content: { type: "doc", content: [{ type: "paragraph" }] },
  });
}

/** Inserts a share directly, bypassing the owner check in upsertShare. */
export async function share(
  documentId: string,
  userId: string,
  role: ShareRole,
) {
  await db.insert(documentShares).values({ documentId, userId, role });
}

/** Status of the AppError a promise rejects with, or "ok" if it resolves. */
export async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
    return "ok";
  } catch (err) {
    return (err as { status?: number }).status;
  }
}
