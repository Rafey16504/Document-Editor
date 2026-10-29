"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api-client";

/** Downloads the document as Markdown, after `beforeExport` (pending autosave) settles. */
export function ExportButton({
  documentId,
  beforeExport,
}: {
  documentId: string;
  beforeExport: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportMarkdown() {
    setBusy(true);
    setError(null);
    try {
      await beforeExport();
      const res = await fetch(`/api/documents/${documentId}/export`);
      if (!res.ok) throw new Error(await errorMessage(res, "Export failed"));
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFrom(res.headers.get("Content-Disposition"));
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error && (
        <p role="status" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void exportMarkdown()}
        disabled={busy}
        className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
      >
        Export .md
      </button>
    </>
  );
}

function filenameFrom(header: string | null): string {
  const encoded = header?.match(/filename\*=UTF-8''([^;]+)/)?.[1];
  return encoded ? decodeURIComponent(encoded) : "document.md";
}
