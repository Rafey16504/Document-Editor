"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorMessage } from "@/lib/api-client";

export function NewDocumentButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", { method: "POST" });
      if (!res.ok) {
        throw new Error(await errorMessage(res, "Could not create document"));
      }
      const { document } = (await res.json()) as { document: { id: string } };
      router.push(`/documents/${document.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create document",
      );
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void create()}
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
      >
        {pending ? "Creating…" : "New document"}
      </button>
    </div>
  );
}
