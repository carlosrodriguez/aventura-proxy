import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
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
export async function generateProxy(
  details: ProxyDetails,
  signature: Uint8Array,
): Promise<Uint8Array> {
  if (!officialTemplateReady())
    throw new Error("Official template not reviewed");
  const pdf = await PDFDocument.create();
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
  let page = pdf.addPage([612, 792]),
    y = 750;
  const clean = (s: string) =>
    s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[—–]/g, "-");
  function line(text: string, size = 11) {
    // Keep each paragraph together when it can fit on a fresh page.
    const estimatedRows = clean(text).split(/\s+/).reduce(
      (state, word) => {
        const next = state.row ? `${state.row} ${word}` : word;
        return font.widthOfTextAtSize(next, size) > 510
          ? { rows: state.rows + 1, row: word }
          : { rows: state.rows, row: next };
      }, { rows: 1, row: "" },
    ).rows;
    const height = estimatedRows * (size + 5) + 8;
    if (height <= 685 && y - height < 65) {
      page = pdf.addPage([612, 792]);
      y = 750;
    }
    const words = clean(text).split(/\s+/);
    let row = "";
    for (const word of words) {
      if (font.widthOfTextAtSize(word, size) > 510) {
        if (row) {
          draw(row, size);
          row = "";
        }
        for (const character of word) {
          if (font.widthOfTextAtSize(row + character, size) > 510) {
            draw(row, size);
            row = "";
          }
          row += character;
        }
        continue;
      }
      if (font.widthOfTextAtSize(`${row} ${word}`, size) > 510) {
        draw(row, size);
        row = word;
      } else row = row ? `${row} ${word}` : word;
    }
    draw(row, size);
    y -= 8;
  }
  function draw(text: string, size: number) {
    if (y < 65) {
      page = pdf.addPage([612, 792]);
      y = 750;
    }
    page.drawText(text, { x: 50, y, size, font, color: rgb(0.08, 0.12, 0.16) });
    y -= size + 5;
  }
  line(proxyConfig.association, 15);
  line("LIMITED PROXY", 18);
  line(
    `Special meeting: ${proxyConfig.meetingDate}; ${proxyConfig.meetingTime}`,
  );
  line(`Location: ${proxyConfig.meetingLocation}`);
  line(`Property: ${details.houseNumber} ${details.street}`);
  line(`Signer: ${details.firstName} ${details.lastName}`);
  if (details.entityName)
    line(`Entity: ${details.entityName}; capacity: ${details.signerTitle}`);
  line(`Proxyholder: ${proxyConfig.proxyholder}`);
  if ("proxyholderSelection" in proxyConfig)
    line(`Proxyholder selection: (${proxyConfig.proxyholderSelection})`);
  line(proxyConfig.executionProxyWording ?? proxyConfig.officialProxyWording);
  for (const p of proxyConfig.proposals) {
    if (y < 165) {
      page = pdf.addPage([612, 792]);
      y = 750;
    }
    line(`${p.label}: ${p.vote}`, 13);
    line(p.language);
  }
  line(`Signed: ${details.signedAt.toISOString()}`);
  line(`Submission ID: ${details.id}`);
  line(`Template version: ${details.templateVersion}`);
  const image = await pdf.embedPng(signature);
  if (y < 150) {
    page = pdf.addPage([612, 792]);
    y = 730;
  }
  const scaled = image.scaleToFit(280, 90);
  page.drawImage(image, {
    x: 50,
    y: y - scaled.height,
    width: scaled.width,
    height: scaled.height,
  });
  y -= scaled.height + 18;
  if ("importantProxyNote" in proxyConfig) line(proxyConfig.importantProxyNote);
  return pdf.save();
}
