import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "./db/schema";
import { AppError } from "./errors";
import { getUserById } from "./users";

const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

// Cookie value: `<userId>.<expiresAtMs>.<base64url HMAC-SHA256 of the first two>`.
// Mocked auth (D-004): the signature only proves the server issued the cookie.

let keyPromise: Promise<CryptoKey> | undefined;

function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  keyPromise ??= crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return keyPromise;
}

async function sign(payload: string): Promise<string> {
  const sig = await crypto.subtle.sign(
    "HMAC",
    await getKey(),
    new TextEncoder().encode(payload),
  );
  return Buffer.from(sig).toString("base64url");
}

/** Returns the user id if the token is authentic and unexpired, else null. */
export async function verifySessionToken(
  token: string,
): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAt, sig] = parts;

  // subtle.verify compares in constant time.
  const valid = await crypto.subtle.verify(
    "HMAC",
    await getKey(),
    Buffer.from(sig, "base64url"),
    new TextEncoder().encode(`${userId}.${expiresAt}`),
  );
  if (!valid || Number(expiresAt) < Date.now()) return null;
  return userId;
}

export async function createSessionToken(userId: string): Promise<string> {
  const payload = `${userId}.${Date.now() + MAX_AGE_SECONDS * 1000}`;
  return `${payload}.${await sign(payload)}`;
}

export async function startSession(userId: string): Promise<void> {
  (await cookies()).set(COOKIE_NAME, await createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

/**
 * The logged-in user, or null if the cookie is missing, invalid or stale.
 * Cached per request so a layout and its page share one lookup.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = await verifySessionToken(token);
  return userId ? getUserById(userId) : null;
});

/** For route handlers: the logged-in user, or a 401 AppError. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AppError(401, "Not logged in");
  return user;
}
