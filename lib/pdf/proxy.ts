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
  const source = await PDFDocument.load(template);
  // The official packet's third page is the proxy. Never include the election ballot.
  if (source.getPageCount() !== 5)
    throw new Error("Expected the official five-page annual meeting packet");
  const pdf = await PDFDocument.create();
  const [proxyPage] = await pdf.copyPages(source, [2]);
  pdf.addPage(proxyPage);
  if (pdf.getPageCount() !== 1)
    throw new Error("Expected one official proxy page");
  const page = pdf.getPage(0);
  if (page.getWidth() !== 612 || page.getHeight() !== 792)
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
  // PDF coordinates reviewed against page 3 of the October 15 official packet.
  field("X", 82, 522, 18, 11);
  field(proxyConfig.proxyholder, 144, 522, 124, 10);
  field(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York" }).format(
      details.signedAt,
    ),
    104,
    402,
    83,
  );
  field(
    `${details.houseNumber} ${details.street}, Miami, FL 33179`,
    282,
    402,
    253,
  );
  field(`${details.firstName} ${details.lastName}`, 135, 381, 151);
  if (details.entityName) field(details.entityName, 197, 359, 90);
  if (details.signerTitle) field(details.signerTitle, 401, 359, 136);
  if (signature) {
    const image = await pdf.embedPng(signature);
    const scaled = image.scaleToFit(157, 17);
    page.drawImage(image, {
      x: 377,
      y: 381,
      width: scaled.width,
      height: scaled.height,
    });
  } else {
    field("PREVIEW - NOT SIGNED", 72, 732, 460, 11);
  }
  if (process.env.PROXY_TEST_MODE === "true")
    field("DEV TEST ONLY - NOT FOR ASSOCIATION SUBMISSION", 72, 748, 468, 10);
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
