"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginUser = { id: string; name: string; email: string };

export function LoginForm({ users }: { users: LoginUser[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(userId: string) {
    setPendingId(userId);
    setError(null);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Login failed");
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setPendingId(null);
    }
  }

  if (users.length === 0) {
    return (
      <p className="mt-6 text-sm text-neutral-600">
        No users found. Run <code className="font-mono">npm run db:seed</code>{" "}
        first.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => void login(user.id)}
          disabled={pendingId !== null}
          className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-left transition hover:border-neutral-400 hover:bg-neutral-50 disabled:opacity-60"
        >
          <span>
            <span className="block font-medium">{user.name}</span>
            <span className="block text-sm text-neutral-500">{user.email}</span>
          </span>
          {pendingId === user.id && (
            <span className="text-sm text-neutral-500">Signing in…</span>
          )}
        </button>
      ))}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
