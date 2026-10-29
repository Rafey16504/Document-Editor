import Link from "next/link";
import { DeleteDocumentButton } from "@/components/delete-document-button";
import { NewDocumentButton } from "@/components/new-document-button";
import { listOwnedDocuments } from "@/server/documents";
import { getCurrentUser } from "@/server/session";

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function DashboardPage() {
  // The (app) layout already redirected logged-out visitors.
  const user = (await getCurrentUser())!;
  const owned = await listOwnedDocuments(user.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My documents</h1>
        <NewDocumentButton />
      </div>

      {owned.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
          No documents yet. Create one to get started.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {owned.map((doc) => (
            <li key={doc.id} className="flex items-center gap-4 px-4 py-3">
              <Link
                href={`/documents/${doc.id}`}
                className="min-w-0 flex-1 hover:underline"
              >
                <span className="block truncate font-medium">{doc.title}</span>
                <span className="block text-sm text-neutral-500">
                  Edited {dateFormat.format(doc.updatedAt)}
                </span>
              </Link>
              <DeleteDocumentButton id={doc.id} title={doc.title} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
