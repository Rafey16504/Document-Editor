import { NextResponse } from "next/server";
import { IMPORT_MAX_BYTES } from "@/lib/import-rules";
import { createDocument } from "@/server/documents";
import { AppError } from "@/server/errors";
import { convertFile } from "@/server/import";
import { handle } from "@/server/route";
import { requireUser } from "@/server/session";

// Room for multipart boundaries and headers around the file itself.
const MAX_BODY_BYTES = IMPORT_MAX_BYTES + 64 * 1024;
const TOO_LARGE = "File is too large. The limit is 2 MB";

export const POST = handle(async (req: Request) => {
  const user = await requireUser();

  // Reject oversized uploads before buffering the multipart body.
  if (Number(req.headers.get("content-length")) > MAX_BODY_BYTES) {
    throw new AppError(413, TOO_LARGE);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new AppError(400, "Expected a multipart form upload");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new AppError(400, "No file uploaded");
  if (file.size > IMPORT_MAX_BYTES) throw new AppError(413, TOO_LARGE);

  const imported = await convertFile(
    file.name,
    new Uint8Array(await file.arrayBuffer()),
  );
  const document = await createDocument(user.id, imported);
  return NextResponse.json({ document }, { status: 201 });
});
