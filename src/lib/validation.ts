import { z } from "zod";

export const loginSchema = z.object({
  userId: z.string().min(1),
});

export const TITLE_MAX = 200;

// Shape check only; the editor schema drops unknown nodes when it loads the JSON.
const docContentSchema = z.looseObject({
  type: z.literal("doc"),
  content: z.array(z.unknown()).optional(),
});

export const updateDocumentSchema = z
  .object({
    title: z.string().trim().max(TITLE_MAX).optional(),
    content: docContentSchema.optional(),
  })
  .refine((v) => v.title !== undefined || v.content !== undefined, {
    message: "Nothing to update",
  });

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

export const SHARE_ROLES = ["viewer", "editor"] as const;

export const shareSchema = z.object({
  // Normalized before the format check so " Bob@Ajaia.dev " matches the stored email.
  email: z.string().trim().toLowerCase().pipe(z.email()),
  role: z.enum(SHARE_ROLES),
});

export type ShareInput = z.infer<typeof shareSchema>;

/** A share as the API returns it to the owner. */
export type Share = {
  userId: string;
  email: string;
  name: string;
  role: (typeof SHARE_ROLES)[number];
};
