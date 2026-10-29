"use client";

import { useRef, useState, type FormEvent } from "react";
import { errorMessage } from "@/lib/api-client";
import { SHARE_ROLES, type Share } from "@/lib/validation";

type Role = Share["role"];

const roleLabels: Record<Role, string> = {
  viewer: "Viewer",
  editor: "Editor",
};

function RoleSelect({
  value,
  onChange,
  disabled,
  label,
}: {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Role)}
      disabled={disabled}
      aria-label={label}
      className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm disabled:opacity-60"
    >
      {SHARE_ROLES.map((r) => (
        <option key={r} value={r}>
          {roleLabels[r]}
        </option>
      ))}
    </select>
  );
}

/** Owner-only: the server rejects everyone else, this just hosts the controls. */
export function ShareDialog({ documentId }: { documentId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [shares, setShares] = useState<Share[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [error, setError] = useState<string | null>(null);
  // userId being changed, or "new" while the form submits.
  const [busy, setBusy] = useState<string | null>(null);

  const base = `/api/documents/${documentId}/shares`;

  async function load() {
    setShares(null);
    setError(null);
    try {
      const res = await fetch(base);
      if (!res.ok) throw new Error(await errorMessage(res, "Could not load"));
      setShares(((await res.json()) as { shares: Share[] }).shares);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sharing");
      setShares([]);
    }
  }

  function open() {
    dialogRef.current?.showModal();
    void load();
  }

  async function grant(body: { email: string; role: Role }, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await errorMessage(res, "Could not share"));
      const { share } = (await res.json()) as { share: Share };
      setShares((prev) =>
        [...(prev ?? []).filter((s) => s.userId !== share.userId), share].sort(
          (a, b) => a.name.localeCompare(b.name),
        ),
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (await grant({ email, role }, "new")) setEmail("");
  }

  async function revoke(share: Share) {
    setBusy(share.userId);
    setError(null);
    try {
      const res = await fetch(`${base}/${share.userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await errorMessage(res, "Could not remove"));
      setShares((prev) =>
        (prev ?? []).filter((s) => s.userId !== share.userId),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove access");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Share
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="share-dialog-title"
        className="m-auto w-full max-w-md rounded-lg p-0 shadow-xl backdrop:bg-black/30"
        // Clicking the backdrop (the dialog element itself) closes it.
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 id="share-dialog-title" className="text-lg font-semibold">
              Share document
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="rounded-md px-2 py-1 text-neutral-500 hover:bg-neutral-100"
            >
              ✕
            </button>
          </div>

          <form onSubmit={(e) => void submit(e)} className="mt-4 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@ajaia.dev"
              aria-label="Email address"
              className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
            />
            <RoleSelect value={role} onChange={setRole} label="Role" />
            <button
              type="submit"
              disabled={busy === "new"}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
            >
              {busy === "new" ? "Sharing…" : "Share"}
            </button>
          </form>

          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <h3 className="mt-6 text-sm font-medium text-neutral-700">
            People with access
          </h3>
          {shares === null ? (
            <p className="mt-2 text-sm text-neutral-500">Loading…</p>
          ) : shares.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              Only you can see this document.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-neutral-200">
              {shares.map((share) => (
                <li key={share.userId} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{share.name}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {share.email}
                    </p>
                  </div>
                  <RoleSelect
                    value={share.role}
                    onChange={(r) =>
                      void grant({ email: share.email, role: r }, share.userId)
                    }
                    disabled={busy === share.userId}
                    label={`Role for ${share.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => void revoke(share)}
                    disabled={busy === share.userId}
                    aria-label={`Remove ${share.name}`}
                    className="rounded-md px-2 py-1.5 text-sm text-neutral-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </>
  );
}
