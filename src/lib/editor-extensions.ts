import StarterKit from "@tiptap/starter-kit";

// Single extension list shared by the editor and server-side import (D-002),
// so stored JSON only ever contains nodes the editor can render.
export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    // No toolbar control for links yet; leaving them out keeps the schema small.
    link: false,
  }),
];
