import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { proxyConfig, officialTemplateReady } from "@/lib/config";
export type ProxyDetails = {
  id: string;
  houseNumber: string;
  street: string;
  firstName: string;
  lastName: string;
  entityName: string | null;
  signerTitle: string | null;
  signedAt: Date;
  templateVersion: string;
};
export async function fillOfficialProxy(
  template: Uint8Array,
  details: ProxyDetails,
  signature: Uint8Array | null,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(template);
  if (pdf.getPageCount() !== 1)
    throw new Error("Expected one official proxy page");
  const page = pdf.getPage(0);
  if (page.getWidth() !== 780 || page.getHeight() !== 1000)
    throw new Error("Unexpected official proxy dimensions");
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(
    await readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff",
      ),
    ),
    { subset: true },
  );
  function field(text: string, x: number, y: number, width: number, size = 10) {
    const value = text.replace(/[\r\n]/g, " ");
    const measured = font.widthOfTextAtSize(value, size);
    const fitted = measured > width ? (size * width) / measured : size;
    if (fitted < 6) throw new Error("Field too long for official proxy");
    page.drawText(value, {
      x,
      y,
      size: fitted,
      font,
      color: rgb(0.03, 0.08, 0.1),
    });
  }
  // Coordinates are tied to the unmodified scanned proxy page in the supplied packet.
  field("X", 76, 735, 20, 12);
  field(proxyConfig.proxyholder, 133, 735, 143);
  for (const y of [515, 459, 402]) field("X", 440, y, 20, 12);
  field(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York" }).format(
      details.signedAt,
    ),
    91,
    365,
    99,
  );
  field(
    `${details.houseNumber} ${details.street}, Miami, FL 33179`,
    259,
    365,
    413,
  );
  field(`${details.firstName} ${details.lastName}`, 121, 342, 199);
  if (details.entityName) field(details.entityName, 186, 319, 180);
  if (details.signerTitle) field(details.signerTitle, 511, 319, 161);
  if (signature) {
    const image = await pdf.embedPng(signature);
    const scaled = image.scaleToFit(245, 23);
    page.drawImage(image, {
      x: 426,
      y: 341,
      width: scaled.width,
      height: scaled.height,
    });
  } else {
    field("PREVIEW - NOT SIGNED", 90, 890, 600, 12);
  }
  if (process.env.PROXY_TEST_MODE === "true")
    field("DEV TEST ONLY - NOT FOR ASSOCIATION SUBMISSION", 90, 918, 600, 12);
  pdf.setTitle("Completed official limited proxy");
  pdf.setSubject(
    `Submission ${details.id}; template ${details.templateVersion}`,
  );
  return pdf.save();
}
export async function generateProxy(
  details: ProxyDetails,
  signature: Uint8Array | null,
): Promise<Uint8Array> {
  if (!officialTemplateReady())
    throw new Error("Official template not reviewed");
  if (!process.env.PROXY_TEMPLATE_PATH)
    throw new Error("Official proxy file unavailable");
  const template = await readFile(process.env.PROXY_TEMPLATE_PATH);
  const hash = createHash("sha256").update(template).digest("hex");
  if (hash !== proxyConfig.proxyTemplateSha256)
    throw new Error("Official proxy file mismatch");
  return fillOfficialProxy(template, details, signature);
}
