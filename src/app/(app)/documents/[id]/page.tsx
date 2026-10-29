import type { JSONContent } from "@tiptap/react";
import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/document-editor";
import { getDocumentForUser } from "@/server/documents";
import { AppError } from "@/server/errors";
import { requirePageUser } from "@/server/session";

export default async function DocumentPage({
  params,
}: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const user = await requirePageUser();

  let result;
  try {
    result = await getDocumentForUser(user.id, id);
  } catch (err) {
    if (err instanceof AppError && err.status === 404) notFound();
    throw err;
  }
  const { document, role } = result;

  return (
    <DocumentEditor
      // Remount when switching documents so editor state never carries over.
      key={document.id}
      id={document.id}
      initialTitle={document.title}
      initialContent={document.content as JSONContent}
      role={role}
    />
  );
}
