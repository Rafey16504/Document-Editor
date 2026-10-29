"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { DEFAULT_TITLE } from "@/lib/document-defaults";
import { editorExtensions } from "@/lib/editor-extensions";
import { TITLE_MAX } from "@/lib/validation";
import { EditorToolbar } from "./editor-toolbar";
import { ExportButton } from "./export-button";
import { RoleBadge } from "./role-badge";
import { ShareDialog } from "./share-dialog";
import { useAutosave, type SaveStatus } from "./use-autosave";

type Role = "owner" | "editor" | "viewer";

type DocumentPatch = { title: string; content: JSONContent };

const statusText: Record<SaveStatus, string> = {
  idle: "All changes saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  saved: "All changes saved",
  error: "Save failed",
};

export function DocumentEditor({
  id,
  initialTitle,
  initialContent,
  role,
}: {
  id: string;
  initialTitle: string;
  initialContent: JSONContent;
  role: Role;
}) {
  const editable = role !== "viewer";
  const [title, setTitle] = useState(initialTitle);

  const save = useCallback(
    async (patch: Partial<DocumentPatch>) => {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await errorMessage(res, "Save failed"));
    },
    [id],
  );
  const router = useRouter();
  const { status, error, queue, flush, retry } = useAutosave<DocumentPatch>(
    save,
    {
      // Drop cached RSC payloads once saved, so Back doesn't reopen a stale copy
      // (which would then autosave over the newer content) and the dashboard is fresh.
      onLeave: () => router.refresh(),
    },
  );

  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent,
    editable,
    // No DOM on the server; render on the client only to avoid hydration mismatches.
    immediatelyRender: false,
    onUpdate: ({ editor }) => queue({ content: editor.getJSON() }),
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral max-w-none min-h-[60vh] px-12 py-10 focus:outline-none",
        "aria-label": "Document content",
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← All documents
        </Link>
        <div className="flex items-center gap-3">
          {editable && (
            <p
              aria-live="polite"
              className={`text-sm ${status === "error" ? "text-red-600" : "text-neutral-500"}`}
            >
              {status === "error" && error
                ? `Save failed: ${error}`
                : statusText[status]}
              {status === "error" && (
                <button
                  type="button"
                  onClick={() => void retry()}
                  className="ml-2 underline"
                >
                  Retry
                </button>
              )}
            </p>
          )}
          <ExportButton documentId={id} beforeExport={flush} />
          {role === "owner" ? (
            <ShareDialog documentId={id} />
          ) : (
            <RoleBadge role={role} />
          )}
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          queue({ title: e.target.value });
        }}
        onBlur={() => {
          // Mirrors the server, which stores an empty title as the default.
          if (!title.trim()) setTitle(DEFAULT_TITLE);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            editor?.commands.focus("start");
          }
        }}
        readOnly={!editable}
        maxLength={TITLE_MAX}
        placeholder={DEFAULT_TITLE}
        aria-label="Document title"
        className="mt-4 w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-3xl font-semibold hover:border-neutral-300 focus:border-neutral-400 focus:outline-none read-only:hover:border-transparent"
      />

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white shadow-sm">
        {editable && <EditorToolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
