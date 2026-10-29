import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

/**
 * Wraps a route handler so thrown errors become `{ error }` JSON responses:
 * AppError keeps its status, invalid input is 400, anything else is a logged 500.
 */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { error: err.message },
          { status: err.status },
        );
      }
      if (err instanceof ZodError) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      console.error(err);
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 },
      );
    }
  };
}

/**
 * Parses a JSON body; malformed JSON is a 400 like invalid input.
 * Bodies over `maxBytes` are rejected with 413 before parsing.
 */
export async function readJson(
  req: Request,
  maxBytes = 100_000,
): Promise<unknown> {
  const declared = Number(req.headers.get("content-length"));
  if (declared > maxBytes) throw new AppError(413, "Request body too large");

  // Content-Length can be absent or wrong, so measure what actually arrived.
  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new AppError(413, "Request body too large");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError(400, "Invalid JSON body");
  }
}
