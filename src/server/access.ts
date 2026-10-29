import { and, eq } from "drizzle-orm";
import { db } from "./db/client";
import { documents, documentShares, type ShareRole } from "./db/schema";
import { AppError } from "./errors";

export type Access = "owner" | ShareRole;

/** The caller's role on a document, or null if they can't see it (or it doesn't exist). */
export async function getAccess(
  userId: string,
  documentId: string,
): Promise<Access | null> {
  const [row] = await db
    .select({ ownerId: documents.ownerId, role: documentShares.role })
    .from(documents)
    .leftJoin(
      documentShares,
      and(
        eq(documentShares.documentId, documents.id),
        eq(documentShares.userId, userId),
      ),
    )
    .where(eq(documents.id, documentId));

  if (!row) return null;
  if (row.ownerId === userId) return "owner";
  return row.role ?? null;
}

/**
 * Throws 404 when the document is invisible to the user (so existence isn't leaked)
 * and 403 when they can see it but their role isn't allowed.
 */
export async function requireAccess(
  userId: string,
  documentId: string,
  allowed: readonly Access[],
): Promise<Access> {
  const access = await getAccess(userId, documentId);
  if (!access) throw new AppError(404, "Document not found");
  if (!allowed.includes(access)) {
    throw new AppError(403, "You don't have permission to do that");
  }
  return access;
}

export const CAN_READ = ["owner", "editor", "viewer"] as const;
export const CAN_EDIT = ["owner", "editor"] as const;
export const CAN_MANAGE = ["owner"] as const;
