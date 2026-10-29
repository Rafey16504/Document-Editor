import { desc, eq } from "drizzle-orm";
import { DEFAULT_TITLE, EMPTY_DOC } from "@/lib/document-defaults";
import type { UpdateDocumentInput } from "@/lib/validation";
import {
  CAN_EDIT,
  CAN_MANAGE,
  CAN_READ,
  requireAccess,
  type Access,
} from "./access";
import { db } from "./db/client";
import {
  documents,
  documentShares,
  users,
  type Document,
  type ShareRole,
} from "./db/schema";

export type DocumentSummary = {
  id: string;
  title: string;
  updatedAt: Date;
};

const summaryColumns = {
  id: documents.id,
  title: documents.title,
  updatedAt: documents.updatedAt,
};

export async function listOwnedDocuments(
  userId: string,
): Promise<DocumentSummary[]> {
  return db
    .select(summaryColumns)
    .from(documents)
    .where(eq(documents.ownerId, userId))
    .orderBy(desc(documents.updatedAt));
}

export type SharedDocumentSummary = DocumentSummary & {
  ownerName: string;
  role: ShareRole;
};

export async function listSharedDocuments(
  userId: string,
): Promise<SharedDocumentSummary[]> {
  return db
    .select({
      ...summaryColumns,
      ownerName: users.name,
      role: documentShares.role,
    })
    .from(documentShares)
    .innerJoin(documents, eq(documents.id, documentShares.documentId))
    .innerJoin(users, eq(users.id, documents.ownerId))
    .where(eq(documentShares.userId, userId))
    .orderBy(desc(documents.updatedAt));
}

export async function createDocument(userId: string): Promise<DocumentSummary> {
  const [doc] = await db
    .insert(documents)
    .values({ ownerId: userId, title: DEFAULT_TITLE, content: EMPTY_DOC })
    .returning(summaryColumns);
  return doc;
}

export async function getDocumentForUser(
  userId: string,
  documentId: string,
): Promise<{ document: Document; role: Access }> {
  const role = await requireAccess(userId, documentId, CAN_READ);
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));
  return { document: doc, role };
}

export async function updateDocument(
  userId: string,
  documentId: string,
  input: UpdateDocumentInput,
): Promise<DocumentSummary> {
  await requireAccess(userId, documentId, CAN_EDIT);
  const [doc] = await db
    .update(documents)
    .set({
      ...(input.title !== undefined && { title: input.title || DEFAULT_TITLE }),
      ...(input.content !== undefined && { content: input.content }),
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId))
    .returning(summaryColumns);
  return doc;
}

export async function deleteDocument(
  userId: string,
  documentId: string,
): Promise<void> {
  await requireAccess(userId, documentId, CAN_MANAGE);
  await db.delete(documents).where(eq(documents.id, documentId));
}
