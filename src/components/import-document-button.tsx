"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { errorMessage } from "@/lib/api-client";
import {
  IMPORT_EXTENSIONS,
  IMPORT_MAX_BYTES,
  importExtension,
} from "@/lib/import-rules";

export function ImportDocumentButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    // Same rules as the server, checked here so mistakes fail instantly.
    if (!importExtension(file.name)) {
      setError("Unsupported file type. Use .txt, .md or .docx");
      return;
    }
    if (file.size > IMPORT_MAX_BYTES) {
      setError("File is too large. The limit is 2 MB");
      return;
    }

    setPending(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/documents/import", {
        method: "POST",
        body,
      });
      if (!res.ok) {
        throw new Error(await errorMessage(res, "Could not import file"));
      }
      const { document } = (await res.json()) as { document: { id: string } };
      router.push(`/documents/${document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import file");
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
      <input
        ref={inputRef}
        type="file"
        accept={IMPORT_EXTENSIONS.join(",")}
        className="hidden"
        aria-label="Import file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so picking the same file again still fires onChange.
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100 disabled:opacity-60"
      >
        {pending ? "Importing…" : "Import file"}
      </button>
    </div>
  );
}
