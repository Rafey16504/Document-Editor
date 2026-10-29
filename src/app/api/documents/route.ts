import { NextResponse } from "next/server";
import { createDocument } from "@/server/documents";
import { handle } from "@/server/route";
import { requireUser } from "@/server/session";

export const POST = handle(async () => {
  const user = await requireUser();
  const document = await createDocument(user.id);
  return NextResponse.json({ document }, { status: 201 });
});
