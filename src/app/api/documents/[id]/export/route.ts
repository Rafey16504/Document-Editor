import { exportDocument } from "@/server/export";
import { handle } from "@/server/route";
import { requireUser } from "@/server/session";

type Context = RouteContext<"/api/documents/[id]/export">;

export const GET = handle(async (_req: Request, ctx: Context) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const { filename, markdown } = await exportDocument(user.id, id);
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // RFC 6266: ASCII fallback plus the UTF-8 name for non-ASCII titles.
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
});
