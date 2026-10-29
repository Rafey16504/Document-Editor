import { handle } from "@/server/route";
import { revokeShare } from "@/server/shares";
import { requireUser } from "@/server/session";

type Context = RouteContext<"/api/documents/[id]/shares/[userId]">;

export const DELETE = handle(async (_req: Request, ctx: Context) => {
  const user = await requireUser();
  const { id, userId } = await ctx.params;
  await revokeShare(user.id, id, userId);
  return new Response(null, { status: 204 });
});
