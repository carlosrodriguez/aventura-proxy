import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextRequest } from "next/server";
import { propertySchema, signerSchema } from "@/lib/validation/submission";
import { generateProxy } from "@/lib/pdf/proxy";
import { proxyConfig } from "@/lib/config";
import {
  clientIp,
  failure,
  HttpError,
  jsonBody,
  originCheck,
  rateLimit,
} from "@/lib/security/http";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    originCheck(req);
    await rateLimit(`preview:${clientIp(req)}`, 20, 600);
    const body = (await jsonBody(req, 4096)) as Record<string, unknown>;
    const property = propertySchema.parse({
      houseNumber: body.houseNumber,
      street: body.street,
    });
    const signer = signerSchema.parse({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      ownershipType: body.ownershipType,
      entityName: body.entityName,
      signerTitle: body.signerTitle,
    });
    const bytes = await generateProxy(
      {
        ...property,
        ...signer,
        id: "unsigned-preview",
        entityName: signer.entityName || null,
        signerTitle: signer.signerTitle || null,
        signedAt: new Date(),
        templateVersion: proxyConfig.templateVersion,
      },
      null,
    );
    const folder = await mkdtemp(join(tmpdir(), "proxy-preview-"));
    try {
      const source = join(folder, "preview.pdf");
      const output = join(folder, "preview");
      await writeFile(source, bytes, { mode: 0o600 });
      await promisify(execFile)(
        "/usr/bin/pdftoppm",
        ["-singlefile", "-png", "-r", "120", source, output],
        { timeout: 15000, maxBuffer: 1024 * 1024 },
      );
      const image = await readFile(`${output}.png`);
      return Response.json(
        {
          pdf: Buffer.from(bytes).toString("base64"),
          image: image.toString("base64"),
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  } catch (error) {
    return failure(
      error instanceof Error && error.name === "ZodError"
        ? new HttpError(400, "Check the property and signer fields")
        : error,
    );
  }
}
