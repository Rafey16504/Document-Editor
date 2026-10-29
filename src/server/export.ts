import type { JSONContent } from "@tiptap/core";
import { DEFAULT_TITLE } from "@/lib/document-defaults";
import { getDocumentForUser } from "./documents";

export type ExportedDocument = { filename: string; markdown: string };

/** Markdown export of any document the user can read (viewers included, D-015). */
export async function exportDocument(
  userId: string,
  documentId: string,
): Promise<ExportedDocument> {
  const { document } = await getDocumentForUser(userId, documentId);
  return {
    filename: `${safeFilename(document.title)}.md`,
    markdown: docToMarkdown(document.content as JSONContent),
  };
}

/**
 * Serializes the editor's schema (StarterKit, headings 1–3, no links) to
 * Markdown. Underline has no Markdown syntax, so it becomes `<u>`, which the
 * Markdown importer turns back into underline.
 */
export function docToMarkdown(doc: JSONContent): string {
  const markdown = blocks(doc.content ?? []);
  return markdown ? `${markdown}\n` : "";
}

function blocks(nodes: JSONContent[]): string {
  return nodes
    .map(block)
    .filter((text) => text !== "")
    .join("\n\n");
}

function block(node: JSONContent): string {
  switch (node.type) {
    case "paragraph":
      return inline(node.content);
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level) || 1, 1), 6);
      return `${"#".repeat(level)} ${inline(node.content)}`;
    }
    case "bulletList":
      return listItems(node, () => "- ");
    case "orderedList": {
      const start = Number(node.attrs?.start) || 1;
      return listItems(node, (i) => `${start + i}. `);
    }
    case "blockquote":
      return prefixLines(blocks(node.content ?? []), "> ");
    case "codeBlock": {
      const code = (node.content ?? []).map((n) => n.text ?? "").join("");
      // A fence longer than any backtick run inside the code.
      const longest = Math.max(
        2,
        ...(code.match(/`+/g) ?? []).map((run) => run.length),
      );
      const fence = "`".repeat(longest + 1);
      return `${fence}${node.attrs?.language ?? ""}\n${code}\n${fence}`;
    }
    case "horizontalRule":
      return "---";
    default:
      // Unknown block: keep its text rather than dropping it.
      return node.content ? blocks(node.content) : "";
  }
}

function listItems(list: JSONContent, marker: (i: number) => string): string {
  return (list.content ?? [])
    .map((item, i) => {
      const prefix = marker(i);
      const body = blocks(item.content ?? []);
      // Continuation lines are indented to the item's content column.
      return (
        prefix + body.replace(/\n(?!\n)/g, `\n${" ".repeat(prefix.length)}`)
      );
    })
    .join("\n");
}

function prefixLines(text: string, prefix: string): string {
  return text
    .split("\n")
    .map((line) => (line ? prefix + line : prefix.trimEnd()))
    .join("\n");
}

const markSyntax: Record<string, [string, string]> = {
  bold: ["**", "**"],
  italic: ["*", "*"],
  strike: ["~~", "~~"],
  underline: ["<u>", "</u>"],
};

function inline(nodes: JSONContent[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === "hardBreak") return "\\\n";
      if (node.type !== "text" || !node.text) return "";
      const marks = (node.marks ?? []).map((m) => m.type);
      let text = marks.includes("code")
        ? inlineCode(node.text)
        : escapeText(node.text);
      for (const mark of marks) {
        const syntax = markSyntax[mark];
        if (syntax) text = `${syntax[0]}${text}${syntax[1]}`;
      }
      return text;
    })
    .join("");
}

function inlineCode(text: string): string {
  const longest = Math.max(
    0,
    ...(text.match(/`+/g) ?? []).map((run) => run.length),
  );
  const ticks = "`".repeat(longest + 1);
  const pad = text.startsWith("`") || text.endsWith("`") ? " " : "";
  return `${ticks}${pad}${text}${pad}${ticks}`;
}

/** Escapes characters that would otherwise turn plain text into Markdown syntax. */
function escapeText(text: string): string {
  return (
    text
      .replace(/[\\`*_~[\]<>|&]/g, "\\$&")
      // Line starts that would read as a heading, list, quote or rule.
      .replace(/^(\s*)([#>+-])/gm, "$1\\$2")
      .replace(/^(\s*\d+)([.)])/gm, "$1\\$2")
  );
}

function safeFilename(title: string): string {
  const name = title
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  return name || DEFAULT_TITLE;
}
