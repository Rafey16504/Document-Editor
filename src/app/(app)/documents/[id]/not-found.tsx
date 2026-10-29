import Link from "next/link";

// Same message for missing and inaccessible documents, so existence isn't leaked.
export default function DocumentNotFound() {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
      <h1 className="text-lg font-semibold">Document not found</h1>
      <p className="mt-1 text-sm text-neutral-500">
        It may have been deleted, or you don&apos;t have access to it.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Back to my documents
      </Link>
    </div>
  );
}
