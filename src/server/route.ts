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

/** Parses a JSON body; malformed JSON is reported as a 400 like invalid input. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError(400, "Invalid JSON body");
  }
}
