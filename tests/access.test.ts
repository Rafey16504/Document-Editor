import { beforeEach, describe, expect, it } from "vitest";
import {
  CAN_EDIT,
  CAN_MANAGE,
  CAN_READ,
  getAccess,
  requireAccess,
} from "@/server/access";
import {
  deleteDocument,
  getDocumentForUser,
  listOwnedDocuments,
  listSharedDocuments,
  updateDocument,
} from "@/server/documents";
import { createDoc, createUser, share, statusOf } from "./helpers";

type User = Awaited<ReturnType<typeof createUser>>;

let owner: User, editor: User, viewer: User, stranger: User;
let docId: string;

beforeEach(async () => {
  [owner, editor, viewer, stranger] = await Promise.all([
    createUser("Owner"),
    createUser("Editor"),
    createUser("Viewer"),
    createUser("Stranger"),
  ]);
  docId = (await createDoc(owner.id, "Plan")).id;
  await share(docId, editor.id, "editor");
  await share(docId, viewer.id, "viewer");
});

describe("getAccess", () => {
  it("returns each user's role", async () => {
    expect(await getAccess(owner.id, docId)).toBe("owner");
    expect(await getAccess(editor.id, docId)).toBe("editor");
    expect(await getAccess(viewer.id, docId)).toBe("viewer");
  });

  it("returns null without a share or for a missing document", async () => {
    expect(await getAccess(stranger.id, docId)).toBeNull();
    expect(await getAccess(owner.id, "no-such-doc")).toBeNull();
  });

  it("ignores shares on other documents", async () => {
    const other = await createDoc(owner.id, "Other");
    expect(await getAccess(editor.id, other.id)).toBeNull();
  });
});

describe("requireAccess", () => {
  it("allows roles in the list", async () => {
    expect(await requireAccess(viewer.id, docId, CAN_READ)).toBe("viewer");
    expect(await requireAccess(editor.id, docId, CAN_EDIT)).toBe("editor");
    expect(await requireAccess(owner.id, docId, CAN_MANAGE)).toBe("owner");
  });

  it("is 403 for a visible document with too low a role", async () => {
    expect(await statusOf(requireAccess(viewer.id, docId, CAN_EDIT))).toBe(403);
    expect(await statusOf(requireAccess(editor.id, docId, CAN_MANAGE))).toBe(
      403,
    );
  });

  it("is 404 when the user can't see the document, so existence isn't leaked", async () => {
    expect(await statusOf(requireAccess(stranger.id, docId, CAN_READ))).toBe(
      404,
    );
    expect(await statusOf(requireAccess(owner.id, "missing", CAN_READ))).toBe(
      404,
    );
  });
});

describe("document operations by role", () => {
  it("lets every role read, and reports the role", async () => {
    const { document, role } = await getDocumentForUser(viewer.id, docId);
    expect(document.title).toBe("Plan");
    expect(role).toBe("viewer");
    expect(await statusOf(getDocumentForUser(stranger.id, docId))).toBe(404);
  });

  it("lets owner and editor update, but not viewer", async () => {
    await updateDocument(editor.id, docId, { title: "Edited" });
    expect((await getDocumentForUser(owner.id, docId)).document.title).toBe(
      "Edited",
    );
    expect(
      await statusOf(updateDocument(viewer.id, docId, { title: "No" })),
    ).toBe(403);
    expect(
      await statusOf(updateDocument(stranger.id, docId, { title: "No" })),
    ).toBe(404);
  });

  it("falls back to the default title when renamed to empty", async () => {
    const doc = await updateDocument(owner.id, docId, { title: "" });
    expect(doc.title).toBe("Untitled document");
  });

  it("lets only the owner delete, and removes shares with the document", async () => {
    expect(await statusOf(deleteDocument(editor.id, docId))).toBe(403);
    await deleteDocument(owner.id, docId);
    expect(await getAccess(owner.id, docId)).toBeNull();
    expect(await listSharedDocuments(editor.id)).toEqual([]);
  });
});

describe("document lists", () => {
  it("lists owned documents only for the owner", async () => {
    expect((await listOwnedDocuments(owner.id)).map((d) => d.id)).toEqual([
      docId,
    ]);
    expect(await listOwnedDocuments(editor.id)).toEqual([]);
  });

  it("lists shared documents with owner name and role", async () => {
    const [doc] = await listSharedDocuments(viewer.id);
    expect(doc).toMatchObject({
      id: docId,
      ownerName: "Owner",
      role: "viewer",
    });
    expect(await listSharedDocuments(stranger.id)).toEqual([]);
    expect(await listSharedDocuments(owner.id)).toEqual([]);
  });
});
