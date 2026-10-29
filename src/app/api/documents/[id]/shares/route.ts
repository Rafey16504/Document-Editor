import { NextResponse } from "next/server";
import { shareSchema } from "@/lib/validation";
import { handle, readJson } from "@/server/route";
import { listShares, upsertShare } from "@/server/shares";
import { requireUser } from "@/server/session";

type Context = RouteContext<"/api/documents/[id]/shares">;

export const GET = handle(async (_req: Request, ctx: Context) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return NextResponse.json({ shares: await listShares(user.id, id) });
});

export const POST = handle(async (req: Request, ctx: Context) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const input = shareSchema.parse(await readJson(req));
  return NextResponse.json({ share: await upsertShare(user.id, id, input) });
});
