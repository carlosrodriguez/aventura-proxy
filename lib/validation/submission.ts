import { z } from "zod";
import { proxyConfig } from "@/lib/config";
const name = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((v) => !/[\x00-\x1f\x7f]/.test(v), "Invalid characters");
export const propertySchema = z
  .object({
    houseNumber: z
      .string()
      .trim()
      .regex(/^[1-9]\d{0,5}[A-Za-z]?$/, "Enter a valid house number"),
    street: z
      .string()
      .refine(
        (v) => (proxyConfig.allowedStreets as readonly string[]).includes(v),
        "Select a listed street",
      ),
  })
  .strict();
export const signerSchema = z
  .object({
    firstName: name,
    lastName: name,
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    ownershipType: z.enum([
      "Individual",
      "Joint ownership",
      "Trust",
      "LLC",
      "Corporation",
      "Other",
    ]),
    entityName: z.string().trim().max(160).optional(),
    signerTitle: z.string().trim().max(100).optional(),
  })
  .strict()
  .superRefine((v, c) => {
    if (["Trust", "LLC", "Corporation", "Other"].includes(v.ownershipType)) {
      if (!v.entityName)
        c.addIssue({
          code: "custom",
          path: ["entityName"],
          message: "Entity name required",
        });
      if (!v.signerTitle)
        c.addIssue({
          code: "custom",
          path: ["signerTitle"],
          message: "Signer capacity required",
        });
    }
  });
export const signatureSchema = z
  .string()
  .max(180000)
  .regex(/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/);
export const submissionSchema = z
  .object({
    ...propertySchema.shape,
    ...signerSchema.shape,
    signature: signatureSchema,
    certified: z.literal(true),
    timezone: z.string().max(80).optional(),
    turnstileToken: z.string().min(1).max(4096),
  })
  .strict()
  .superRefine((v, c) => {
    const result = signerSchema.safeParse({
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      ownershipType: v.ownershipType,
      entityName: v.entityName,
      signerTitle: v.signerTitle,
    });
    if (!result.success)
      result.error.issues.forEach((i) => c.addIssue({ ...i }));
  });
export const verifySchema = z
  .object({ code: z.string().regex(/^\d{6}$/) })
  .strict();
