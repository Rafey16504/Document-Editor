import { and, asc, eq } from "drizzle-orm";
import type { Share, ShareInput } from "@/lib/validation";
import { CAN_MANAGE, requireAccess } from "./access";
import { db } from "./db/client";
import { documentShares, users } from "./db/schema";
import { AppError } from "./errors";

const shareColumns = {
  userId: users.id,
  email: users.email,
  name: users.name,
  role: documentShares.role,
};

export async function listShares(
  userId: string,
  documentId: string,
): Promise<Share[]> {
  await requireAccess(userId, documentId, CAN_MANAGE);
  return db
    .select(shareColumns)
    .from(documentShares)
    .innerJoin(users, eq(users.id, documentShares.userId))
    .where(eq(documentShares.documentId, documentId))
    .orderBy(asc(users.name));
}

/** Grants access, or changes the role if the user already has a share. */
export async function upsertShare(
  userId: string,
  documentId: string,
  input: ShareInput,
): Promise<Share> {
  await requireAccess(userId, documentId, CAN_MANAGE);

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email));
  if (!target) throw new AppError(404, "No user with that email");
  // Only the owner gets this far, so the target being the caller means the owner.
  if (target.id === userId) {
    throw new AppError(400, "You already own this document");
  }

  await db
    .insert(documentShares)
    .values({ documentId, userId: target.id, role: input.role })
    .onConflictDoUpdate({
      target: [documentShares.documentId, documentShares.userId],
      set: { role: input.role },
    });

  return {
    userId: target.id,
    email: target.email,
    name: target.name,
    role: input.role,
  };
}

/** Idempotent: revoking a share that doesn't exist is not an error. */
export async function revokeShare(
  userId: string,
  documentId: string,
  targetUserId: string,
): Promise<void> {
  await requireAccess(userId, documentId, CAN_MANAGE);
  await db
    .delete(documentShares)
    .where(
      and(
        eq(documentShares.documentId, documentId),
        eq(documentShares.userId, targetUserId),
      ),
    );
}
