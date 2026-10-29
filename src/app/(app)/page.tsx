import Link from "next/link";
import { DeleteDocumentButton } from "@/components/delete-document-button";
import { ImportDocumentButton } from "@/components/import-document-button";
import { NewDocumentButton } from "@/components/new-document-button";
import { RoleBadge } from "@/components/role-badge";
import { listOwnedDocuments, listSharedDocuments } from "@/server/documents";
import { getCurrentUser } from "@/server/session";

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

const listClass =
  "mt-4 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white";
const emptyClass =
  "mt-4 rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500";

export default async function DashboardPage() {
  // The (app) layout already redirected logged-out visitors.
  const user = (await getCurrentUser())!;
  const [owned, shared] = await Promise.all([
    listOwnedDocuments(user.id),
    listSharedDocuments(user.id),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My documents</h1>
          <div className="flex items-center gap-3">
            <ImportDocumentButton />
            <NewDocumentButton />
          </div>
        </div>
        <p className="mt-1 text-right text-sm text-neutral-500">
          Import .txt, .md or .docx (max 2 MB). Images and tables aren&apos;t
          kept.
        </p>

        {owned.length === 0 ? (
          <p className={emptyClass}>
            No documents yet. Create one to get started.
          </p>
        ) : (
          <ul className={listClass}>
            {owned.map((doc) => (
              <li key={doc.id} className="flex items-center gap-4 px-4 py-3">
                <Link
                  href={`/documents/${doc.id}`}
                  className="min-w-0 flex-1 hover:underline"
                >
                  <span className="block truncate font-medium">
                    {doc.title}
                  </span>
                  <span className="block text-sm text-neutral-500">
                    Edited {dateFormat.format(doc.updatedAt)}
                  </span>
                </Link>
                <DeleteDocumentButton id={doc.id} title={doc.title} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Shared with me</h2>

        {shared.length === 0 ? (
          <p className={emptyClass}>
            Nothing shared with you yet. Documents others share appear here.
          </p>
        ) : (
          <ul className={listClass}>
            {shared.map((doc) => (
              <li key={doc.id} className="flex items-center gap-4 px-4 py-3">
                <Link
                  href={`/documents/${doc.id}`}
                  className="min-w-0 flex-1 hover:underline"
                >
                  <span className="block truncate font-medium">
                    {doc.title}
                  </span>
                  <span className="block text-sm text-neutral-500">
                    Owned by {doc.ownerName} · Edited{" "}
                    {dateFormat.format(doc.updatedAt)}
                  </span>
                </Link>
                <RoleBadge role={doc.role} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
