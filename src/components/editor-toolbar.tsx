"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import type { ReactNode } from "react";

type Level = 1 | 2 | 3;
const levels: Level[] = [1, 2, 3];

export function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    // Keeps the layout stable until the client-only editor mounts.
    return <div className="h-11 border-b border-neutral-200" />;
  }
  // useEditorState keeps the editor it first saw until the next transaction, so it
  // must start with a real instance or the toolbar stays blank until a click.
  return <Toolbar editor={editor} />;
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      heading: levels.find((level) => editor.isActive("heading", { level })),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-t-lg border-b border-neutral-200 bg-white/95 px-2 py-1.5 backdrop-blur"
    >
      <ToolbarButton
        label="Bold"
        active={state.bold}
        onClick={() => chain().toggleBold().run()}
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={state.italic}
        onClick={() => chain().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={state.underline}
        onClick={() => chain().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <Divider />
      {levels.map((level) => (
        <ToolbarButton
          key={level}
          label={`Heading ${level}`}
          active={state.heading === level}
          onClick={() => chain().toggleHeading({ level }).run()}
        >
          H{level}
        </ToolbarButton>
      ))}

      <Divider />
      <ToolbarButton
        label="Bulleted list"
        active={state.bulletList}
        onClick={() => chain().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={state.orderedList}
        onClick={() => chain().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>

      <Divider />
      <ToolbarButton
        label="Undo"
        disabled={!state.canUndo}
        onClick={() => chain().undo().run()}
      >
        ↶
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!state.canRedo}
        onClick={() => chain().redo().run()}
      >
        ↷
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep focus and selection in the editor; otherwise the first keystrokes
      // after a click land on the button (and Space re-triggers it).
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-8 min-w-8 rounded px-2 text-sm hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent ${active ? "bg-neutral-200 hover:bg-neutral-200" : ""}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-neutral-200" />;
}
