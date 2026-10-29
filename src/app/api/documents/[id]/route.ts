import { NextResponse } from "next/server";
import { MAX_DOCUMENT_BYTES, updateDocumentSchema } from "@/lib/validation";
import {
  deleteDocument,
  getDocumentForUser,
  updateDocument,
} from "@/server/documents";
import { handle, readJson } from "@/server/route";
import { requireUser } from "@/server/session";

type Context = RouteContext<"/api/documents/[id]">;

export const GET = handle(async (_req: Request, ctx: Context) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return NextResponse.json(await getDocumentForUser(user.id, id));
});

export const PATCH = handle(async (req: Request, ctx: Context) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const input = updateDocumentSchema.parse(
    await readJson(req, MAX_DOCUMENT_BYTES),
  );
  const document = await updateDocument(user.id, id, input);
  return NextResponse.json({ document });
});

export const DELETE = handle(async (_req: Request, ctx: Context) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await deleteDocument(user.id, id);
  return new Response(null, { status: 204 });
});
