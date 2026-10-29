import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { AppError } from "@/server/errors";
import { handle, readJson } from "@/server/route";
import { endSession, startSession } from "@/server/session";
import { getUserById } from "@/server/users";

export const POST = handle(async (req: Request) => {
  const { userId } = loginSchema.parse(await readJson(req));
  const user = await getUserById(userId);
  if (!user) throw new AppError(404, "User not found");

  await startSession(user.id);
  return NextResponse.json({ user });
});

export const DELETE = handle(async () => {
  await endSession();
  return new Response(null, { status: 204 });
});
