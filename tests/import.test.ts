import { readFileSync } from "node:fs";
import type { JSONContent } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { importExtension } from "@/lib/import-rules";
import { convertFile, htmlToDoc, textToDoc } from "@/server/import";
import { statusOf } from "./helpers";

const fixture = (name: string) =>
  new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));
const bytes = (text: string) => new TextEncoder().encode(text);

/** Node types in document order, for asserting structure without full JSON. */
function types(node: JSONContent): string[] {
  return [node.type ?? "", ...(node.content ?? []).flatMap(types)];
}

/** Every text node with its mark names. */
function texts(node: JSONContent): { text: string; marks: string[] }[] {
  if (node.text !== undefined) {
    return [{ text: node.text, marks: (node.marks ?? []).map((m) => m.type) }];
  }
  return (node.content ?? []).flatMap(texts);
}

const plainText = (node: JSONContent) =>
  texts(node)
    .map((t) => t.text)
    .join("");

describe("importExtension", () => {
  it("accepts supported extensions case-insensitively", () => {
    expect(importExtension("notes.txt")).toBe(".txt");
    expect(importExtension("README.MD")).toBe(".md");
    expect(importExtension("my.report.Docx")).toBe(".docx");
  });

  it("rejects other or missing extensions", () => {
    expect(importExtension("scan.pdf")).toBeNull();
    expect(importExtension("Makefile")).toBeNull();
    expect(importExtension("notes.txt.exe")).toBeNull();
    expect(importExtension("")).toBeNull();
  });
});

describe("textToDoc", () => {
  it("splits paragraphs on blank lines and keeps single newlines as breaks", () => {
    expect(textToDoc("one\ntwo\n\nthree")).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "one" },
            { type: "hardBreak" },
            { type: "text", text: "two" },
          ],
        },
        { type: "paragraph", content: [{ type: "text", text: "three" }] },
      ],
    });
  });

  it("normalizes CRLF and treats whitespace-only lines as blank", () => {
    const doc = textToDoc("a\r\n \t\r\nb\rc");
    expect(doc.content).toHaveLength(2);
    expect(types(doc)).toEqual([
      "doc",
      "paragraph",
      "text",
      "paragraph",
      "text",
      "hardBreak",
      "text",
    ]);
  });

  it("drops empty input and keeps markup as literal text", () => {
    expect(textToDoc("\n\n  \n").content).toEqual([]);
    expect(plainText(textToDoc("<b>hi</b>"))).toBe("<b>hi</b>");
  });
});

describe("htmlToDoc", () => {
  it("keeps what the editor supports", () => {
    const doc = htmlToDoc(
      "<h2>T</h2><p><strong>b</strong><em>i</em><u>u</u></p><ol><li>x</li></ol>",
    );
    expect(types(doc)).toEqual([
      "doc",
      "heading",
      "text",
      "paragraph",
      "text",
      "text",
      "text",
      "orderedList",
      "listItem",
      "paragraph",
      "text",
    ]);
    expect(texts(doc).map((t) => t.marks)).toEqual([
      [],
      ["bold"],
      ["italic"],
      ["underline"],
      [],
    ]);
  });

  it("drops scripts, images and links (text of links survives)", () => {
    const doc = htmlToDoc(
      '<p>a<script>alert(1)</script><img src="x.png"><a href="https://x">link</a></p>',
    );
    expect(types(doc)).not.toContain("image");
    expect(plainText(doc)).toBe("alink");
    expect(JSON.stringify(doc)).not.toMatch(/alert|href|x\.png/);
  });

  it("caps headings at level 3", () => {
    const [h] = htmlToDoc("<h1>a</h1><h5>b</h5>").content ?? [];
    expect(h).toMatchObject({ type: "heading", attrs: { level: 1 } });
    expect(types(htmlToDoc("<h5>b</h5>"))).not.toContain("heading");
  });
});

describe("convertFile", () => {
  it("imports .txt with the file name as title", async () => {
    const { title, content } = await convertFile(
      "Meeting notes.TXT",
      bytes("﻿Hello\n\nWorld"),
    );
    expect(title).toBe("Meeting notes");
    expect(content.content).toHaveLength(2);
    expect(plainText(content)).toBe("HelloWorld");
  });

  it("imports .md with headings, marks, nested lists, quote, code and rule", async () => {
    const { title, content } = await convertFile(
      "release.md",
      fixture("sample.md"),
    );
    expect(title).toBe("release");
    const nodeTypes = types(content);
    for (const t of [
      "heading",
      "bulletList",
      "orderedList",
      "blockquote",
      "codeBlock",
      "horizontalRule",
    ]) {
      expect(nodeTypes).toContain(t);
    }
    // Nested list survives as a list inside a list item.
    expect(nodeTypes.join(" ")).toMatch(/listItem paragraph text bulletList/);
    const marks = texts(content).flatMap((t) => t.marks);
    expect(marks).toEqual(expect.arrayContaining(["bold", "italic", "code"]));
    expect(JSON.stringify(content)).not.toMatch(/alert|logo\.png|example\.com/);
  });

  it("imports .docx with headings, marks and lists", async () => {
    const { title, content } = await convertFile(
      "plan.docx",
      fixture("sample.docx"),
    );
    expect(title).toBe("plan");
    expect(content.content?.[0]).toMatchObject({
      type: "heading",
      attrs: { level: 1 },
    });
    expect(types(content)).toContain("bulletList");
    const marked = Object.fromEntries(
      texts(content).map((t) => [t.text, t.marks]),
    );
    expect(marked).toMatchObject({
      bold: ["bold"],
      italic: ["italic"],
      underlined: ["underline"],
    });
  });

  it("falls back to the default title for a name like '.txt'", async () => {
    expect((await convertFile(".txt", bytes("x"))).title).toBe(
      "Untitled document",
    );
  });

  it("rejects unsupported types, empty files and corrupt .docx with 400", async () => {
    expect(await statusOf(convertFile("a.pdf", bytes("x")))).toBe(400);
    expect(await statusOf(convertFile("a.txt", bytes(" \n\n ")))).toBe(400);
    expect(await statusOf(convertFile("a.md", bytes("![img](x.png)")))).toBe(
      400,
    );
    expect(await statusOf(convertFile("a.docx", fixture("empty.docx")))).toBe(
      400,
    );
    expect(await statusOf(convertFile("a.docx", fixture("corrupt.docx")))).toBe(
      400,
    );
  });

  it("rejects input whose JSON would exceed the document limit with 413", async () => {
    // ~1 MB of one-character lines expands to far more than 4 MB of JSON.
    const text = "x\n".repeat(500_000);
    expect(await statusOf(convertFile("big.txt", bytes(text)))).toBe(413);
  });
});
