"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage } from "@/lib/api-client";

export function DeleteDocumentButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setPending(true);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(await errorMessage(res, "Could not delete document"));
      }
      router.refresh();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Could not delete document",
      );
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void remove()}
      disabled={pending}
      aria-label={`Delete ${title}`}
      className="rounded-md px-3 py-1.5 text-sm text-neutral-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
