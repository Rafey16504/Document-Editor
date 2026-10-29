import type { JSONContent } from "@tiptap/core";
import { beforeEach, describe, expect, it } from "vitest";
import { updateDocument } from "@/server/documents";
import { docToMarkdown, exportDocument } from "@/server/export";
import { convertFile } from "@/server/import";
import { createDoc, createUser, share, statusOf } from "./helpers";

const text = (value: string, ...marks: string[]): JSONContent => ({
  type: "text",
  text: value,
  ...(marks.length > 0 && { marks: marks.map((type) => ({ type })) }),
});
const p = (...content: JSONContent[]): JSONContent => ({
  type: "paragraph",
  content,
});
const item = (...content: JSONContent[]): JSONContent => ({
  type: "listItem",
  content,
});
const doc = (...content: JSONContent[]): JSONContent => ({
  type: "doc",
  content,
});

describe("docToMarkdown", () => {
  it("writes headings, paragraphs and marks", () => {
    expect(
      docToMarkdown(
        doc(
          { type: "heading", attrs: { level: 2 }, content: [text("Title")] },
          p(
            text("bold", "bold"),
            text(" "),
            text("it", "italic"),
            text(" "),
            text("under", "underline"),
            text(" "),
            text("gone", "strike"),
            text(" "),
            text("x = 1", "code"),
            text(" "),
            text("both", "bold", "italic"),
          ),
        ),
      ),
    ).toBe(
      "## Title\n\n**bold** *it* <u>under</u> ~~gone~~ `x = 1` ***both***\n",
    );
  });

  it("writes nested bullet and numbered lists", () => {
    expect(
      docToMarkdown(
        doc(
          {
            type: "bulletList",
            content: [
              item(p(text("one")), {
                type: "orderedList",
                attrs: { start: 1 },
                content: [item(p(text("a"))), item(p(text("b")))],
              }),
              item(p(text("two"))),
            ],
          },
          {
            type: "orderedList",
            attrs: { start: 3 },
            content: [item(p(text("three")))],
          },
        ),
      ),
    ).toBe("- one\n\n  1. a\n  2. b\n- two\n\n3. three\n");
  });

  it("writes quotes, code blocks, rules and hard breaks", () => {
    expect(
      docToMarkdown(
        doc(
          { type: "blockquote", content: [p(text("q1")), p(text("q2"))] },
          {
            type: "codeBlock",
            attrs: { language: "ts" },
            content: [text("const a = `x`;\nlet b;")],
          },
          { type: "horizontalRule" },
          p(text("line 1"), { type: "hardBreak" }, text("line 2")),
        ),
      ),
    ).toBe(
      "> q1\n>\n> q2\n\n```ts\nconst a = `x`;\nlet b;\n```\n\n---\n\nline 1\\\nline 2\n",
    );
  });

  it("escapes text that would read as Markdown", () => {
    expect(
      docToMarkdown(
        doc(p(text("# not a heading")), p(text("1. no list *or* <b>tag</b>"))),
      ),
    ).toBe("\\# not a heading\n\n1\\. no list \\*or\\* \\<b\\>tag\\</b\\>\n");
  });

  it("returns an empty string for an empty document", () => {
    expect(docToMarkdown(doc(p()))).toBe("");
    expect(docToMarkdown({ type: "doc" })).toBe("");
  });

  it("round-trips through the Markdown importer", async () => {
    const original = doc(
      { type: "heading", attrs: { level: 1 }, content: [text("Plan")] },
      p(
        text("Ship "),
        text("it", "bold"),
        text(", "),
        text("carefully", "underline"),
        text(" & test *stars*"),
      ),
      {
        type: "bulletList",
        content: [item(p(text("first"))), item(p(text("second")))],
      },
      {
        type: "orderedList",
        attrs: { start: 1 },
        content: [item(p(text("n")))],
      },
      { type: "blockquote", content: [p(text("quoted"))] },
    );
    const markdown = docToMarkdown(original);
    const { content } = await convertFile(
      "plan.md",
      new TextEncoder().encode(markdown),
    );
    expect(docToMarkdown(content)).toBe(markdown);
  });
});

describe("exportDocument", () => {
  type User = Awaited<ReturnType<typeof createUser>>;
  let owner: User, viewer: User, stranger: User;
  let docId: string;

  beforeEach(async () => {
    [owner, viewer, stranger] = await Promise.all([
      createUser("Owner"),
      createUser("Viewer"),
      createUser("Stranger"),
    ]);
    docId = (await createDoc(owner.id, "Q3 plan: draft/v2")).id;
    await updateDocument(owner.id, docId, {
      content: { type: "doc", content: [p(text("Hello", "bold"))] },
    });
    await share(docId, viewer.id, "viewer");
  });

  it("exports for the owner and viewers, with a safe file name", async () => {
    for (const user of [owner, viewer]) {
      expect(await exportDocument(user.id, docId)).toEqual({
        filename: "Q3 plan draftv2.md",
        markdown: "**Hello**\n",
      });
    }
  });

  it("returns 404 for users without access", async () => {
    expect(await statusOf(exportDocument(stranger.id, docId))).toBe(404);
  });
});
