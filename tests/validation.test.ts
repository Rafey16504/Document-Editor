import { describe, expect, it, vi } from "vitest";
import { shareSchema, updateDocumentSchema } from "@/lib/validation";
import { AppError } from "@/server/errors";
import { handle, readJson } from "@/server/route";
import { createSessionToken, verifySessionToken } from "@/server/session";
import { statusOf } from "./helpers";

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://test/api", { method: "POST", body, headers });

describe("shareSchema", () => {
  it("trims and lowercases the email", () => {
    expect(
      shareSchema.parse({ email: "  Bob@Ajaia.DEV ", role: "editor" }),
    ).toEqual({ email: "bob@ajaia.dev", role: "editor" });
  });

  it("rejects bad emails and roles other than viewer/editor", () => {
    expect(
      shareSchema.safeParse({ email: "bob", role: "viewer" }).success,
    ).toBe(false);
    expect(
      shareSchema.safeParse({ email: "b@x.dev", role: "owner" }).success,
    ).toBe(false);
  });
});

describe("updateDocumentSchema", () => {
  it("accepts a title, content, or both", () => {
    expect(updateDocumentSchema.parse({ title: "  Hi  " })).toEqual({
      title: "Hi",
    });
    const content = { type: "doc", content: [{ type: "paragraph" }] };
    expect(updateDocumentSchema.parse({ content })).toEqual({ content });
  });

  it("rejects empty updates, non-doc content and overlong titles", () => {
    expect(updateDocumentSchema.safeParse({}).success).toBe(false);
    expect(
      updateDocumentSchema.safeParse({ content: { type: "paragraph" } })
        .success,
    ).toBe(false);
    expect(
      updateDocumentSchema.safeParse({ title: "x".repeat(201) }).success,
    ).toBe(false);
  });
});

describe("readJson", () => {
  it("parses a JSON body", async () => {
    expect(await readJson(post('{"a":1}'))).toEqual({ a: 1 });
  });

  it("is 400 for malformed JSON", async () => {
    expect(await statusOf(readJson(post("{nope")))).toBe(400);
  });

  it("is 413 when Content-Length or the actual body exceeds the limit", async () => {
    expect(
      await statusOf(readJson(post("{}", { "content-length": "999" }), 10)),
    ).toBe(413);
    // A lying Content-Length doesn't get past the measured check.
    expect(
      await statusOf(
        readJson(
          post(JSON.stringify("x".repeat(20)), { "content-length": "2" }),
          10,
        ),
      ),
    ).toBe(413);
  });
});

describe("handle", () => {
  async function run(err: unknown) {
    const res = await handle(async () => {
      throw err;
    })();
    return { status: res.status, body: await res.json() };
  }

  it("maps AppError to its status and message", async () => {
    expect(await run(new AppError(404, "Document not found"))).toEqual({
      status: 404,
      body: { error: "Document not found" },
    });
  });

  it("maps Zod errors to 400", async () => {
    const zodError = shareSchema.safeParse({}).error;
    expect(await run(zodError)).toEqual({
      status: 400,
      body: { error: "Invalid request" },
    });
  });

  it("hides unknown errors behind a generic 500 and logs them", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await run(new Error("db password is hunter2"))).toEqual({
      status: 500,
      body: { error: "Something went wrong" },
    });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

describe("session tokens", () => {
  it("round-trips a user id", async () => {
    const token = await createSessionToken("user-1");
    expect(await verifySessionToken(token)).toBe("user-1");
  });

  it("rejects tampered, malformed and expired tokens", async () => {
    const [, expires, sig] = (await createSessionToken("user-1")).split(".");
    expect(await verifySessionToken(`user-2.${expires}.${sig}`)).toBeNull();
    expect(await verifySessionToken("garbage")).toBeNull();

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000);
    expect(await verifySessionToken(`user-1.${expires}.${sig}`)).toBeNull();
    vi.useRealTimers();
  });
});
