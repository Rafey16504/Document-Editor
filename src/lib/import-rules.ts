// Shared by the upload UI (instant feedback) and the import route (enforced).
export const IMPORT_EXTENSIONS = [".txt", ".md", ".docx"] as const;

export type ImportExtension = (typeof IMPORT_EXTENSIONS)[number];

export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;

/** Lowercased extension if it is one we import, else null. */
export function importExtension(fileName: string): ImportExtension | null {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = fileName.slice(dot).toLowerCase();
  return (IMPORT_EXTENSIONS as readonly string[]).includes(ext)
    ? (ext as ImportExtension)
    : null;
}
