import { generateJSON } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/core";
import mammoth from "mammoth";
import { marked } from "marked";
import { DEFAULT_TITLE } from "@/lib/document-defaults";
import { editorExtensions } from "@/lib/editor-extensions";
import { importExtension, type ImportExtension } from "@/lib/import-rules";
import { MAX_DOCUMENT_BYTES, TITLE_MAX } from "@/lib/validation";
import { AppError } from "./errors";

export type ImportedDocument = { title: string; content: JSONContent };

/**
 * Converts an uploaded file into a title and Tiptap JSON. HTML from Markdown and
 * .docx goes through the editor's own schema, so unsupported nodes are dropped.
 */
export async function convertFile(
  fileName: string,
  bytes: Uint8Array,
): Promise<ImportedDocument> {
  const ext = importExtension(fileName);
  if (!ext) {
    throw new AppError(400, "Unsupported file type. Use .txt, .md or .docx");
  }

  const content = await toDoc(ext, bytes);
  if (!hasText(content)) throw new AppError(400, "File is empty");

  if (
    new TextEncoder().encode(JSON.stringify(content)).byteLength >
    MAX_DOCUMENT_BYTES
  ) {
    throw new AppError(413, "File is too large to import");
  }

  return { title: titleFrom(fileName), content };
}

async function toDoc(
  ext: ImportExtension,
  bytes: Uint8Array,
): Promise<JSONContent> {
  switch (ext) {
    case ".txt":
      return textToDoc(decodeText(bytes));
    case ".md":
      return htmlToDoc(
        marked.parse(decodeText(bytes), { async: false, gfm: true }),
      );
    case ".docx":
      return htmlToDoc(await docxToHtml(bytes));
  }
}

function decodeText(bytes: Uint8Array): string {
  // TextDecoder strips a UTF-8 BOM; invalid bytes become U+FFFD instead of failing.
  return new TextDecoder("utf-8").decode(bytes);
}

/** Blank lines separate paragraphs; single newlines are kept as line breaks. */
export function textToDoc(text: string): JSONContent {
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((block) => block.replace(/^\n+|\n+$/g, ""))
    .filter((block) => block.trim() !== "")
    .map((block): JSONContent => {
      const content: JSONContent[] = [];
      block.split("\n").forEach((line, i) => {
        if (i > 0) content.push({ type: "hardBreak" });
        if (line) content.push({ type: "text", text: line });
      });
      return { type: "paragraph", content };
    });
  return { type: "doc", content: paragraphs };
}

export function htmlToDoc(html: string): JSONContent {
  return generateJSON(html, editorExtensions);
}

async function docxToHtml(bytes: Uint8Array): Promise<string> {
  try {
    const { value } = await mammoth.convertToHtml(
      { buffer: Buffer.from(bytes) },
      {
        // mammoth drops underline unless mapped; the editor supports it.
        styleMap: ["u => u"],
        // Images aren't supported by the editor; skip mammoth's base64 encoding of them.
        convertImage: mammoth.images.imgElement(async () => ({ src: "" })),
      },
    );
    return value;
  } catch {
    throw new AppError(400, "Could not read this .docx file");
  }
}

function hasText(node: JSONContent): boolean {
  if (node.text?.trim()) return true;
  return node.content?.some(hasText) ?? false;
}

function titleFrom(fileName: string): string {
  const base = fileName.slice(0, fileName.lastIndexOf(".")).trim();
  return base.slice(0, TITLE_MAX).trim() || DEFAULT_TITLE;
}
