import { beforeEach, describe, expect, it } from "vitest";
import { getAccess } from "@/server/access";
import { listShares, revokeShare, upsertShare } from "@/server/shares";
import { createDoc, createUser, statusOf } from "./helpers";

type User = Awaited<ReturnType<typeof createUser>>;

let owner: User, bob: User, carol: User;
let docId: string;

beforeEach(async () => {
  [owner, bob, carol] = await Promise.all([
    createUser("Owner"),
    createUser("Bob"),
    createUser("Carol"),
  ]);
  docId = (await createDoc(owner.id)).id;
});

describe("upsertShare", () => {
  it("grants access by email and returns the share", async () => {
    const share = await upsertShare(owner.id, docId, {
      email: bob.email,
      role: "viewer",
    });
    expect(share).toEqual({
      userId: bob.id,
      email: bob.email,
      name: "Bob",
      role: "viewer",
    });
    expect(await getAccess(bob.id, docId)).toBe("viewer");
  });

  it("changes the role when the user already has a share", async () => {
    await upsertShare(owner.id, docId, { email: bob.email, role: "viewer" });
    await upsertShare(owner.id, docId, { email: bob.email, role: "editor" });
    expect(await getAccess(bob.id, docId)).toBe("editor");
    expect(await listShares(owner.id, docId)).toHaveLength(1);
  });

  it("is 404 for an unknown email and 400 for the owner's own email", async () => {
    expect(
      await statusOf(
        upsertShare(owner.id, docId, { email: "nobody@x.dev", role: "viewer" }),
      ),
    ).toBe(404);
    expect(
      await statusOf(
        upsertShare(owner.id, docId, { email: owner.email, role: "editor" }),
      ),
    ).toBe(400);
  });

  it("is owner-only: 403 for an editor, 404 for a stranger", async () => {
    await upsertShare(owner.id, docId, { email: bob.email, role: "editor" });
    expect(
      await statusOf(
        upsertShare(bob.id, docId, { email: carol.email, role: "viewer" }),
      ),
    ).toBe(403);
    expect(
      await statusOf(
        upsertShare(carol.id, docId, { email: carol.email, role: "editor" }),
      ),
    ).toBe(404);
    expect(await getAccess(carol.id, docId)).toBeNull();
  });
});

describe("listShares", () => {
  it("lists shares sorted by name, owner-only", async () => {
    await upsertShare(owner.id, docId, { email: carol.email, role: "editor" });
    await upsertShare(owner.id, docId, { email: bob.email, role: "viewer" });
    expect((await listShares(owner.id, docId)).map((s) => s.name)).toEqual([
      "Bob",
      "Carol",
    ]);
    expect(await statusOf(listShares(bob.id, docId))).toBe(403);
  });
});

describe("revokeShare", () => {
  it("removes access and is idempotent", async () => {
    await upsertShare(owner.id, docId, { email: bob.email, role: "editor" });
    await revokeShare(owner.id, docId, bob.id);
    expect(await getAccess(bob.id, docId)).toBeNull();
    await expect(revokeShare(owner.id, docId, bob.id)).resolves.toBeUndefined();
  });

  it("is owner-only", async () => {
    await upsertShare(owner.id, docId, { email: bob.email, role: "editor" });
    await upsertShare(owner.id, docId, { email: carol.email, role: "viewer" });
    expect(await statusOf(revokeShare(bob.id, docId, carol.id))).toBe(403);
    expect(await getAccess(carol.id, docId)).toBe("viewer");
  });
});
