import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/security/admin";
import { failure, HttpError, jsonBody, originCheck } from "@/lib/security/http";
import { temporaryUrl } from "@/lib/storage";
import { event, deliverReceipt } from "@/lib/submissions";
export function csvCell(value: unknown) {
  const s = String(value ?? "");
  return (
    '"' + (/^[=+@\-\t\r\n]/.test(s) ? "'" : "") + s.replaceAll('"', '""') + '"'
  );
}
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const isCsv = req.nextUrl.searchParams.get("format") === "csv";
    const after = req.nextUrl.searchParams.get("after");
    if (after && !z.uuid().safeParse(after).success)
      throw new HttpError(400, "Invalid cursor");
    const rows = await db().proxySubmission.findMany({
      take: isCsv ? undefined : 100,
      orderBy: { id: "asc" },
      ...(after ? { cursor: { id: after }, skip: 1 } : {}),
      include: { events: { orderBy: { timestamp: "asc" } } },
    });
    for (const s of rows)
      await event(s.id, "ADMIN_VIEWED", { admin: admin.email });
    if (isCsv) {
      const fields = [
        "id",
        "houseNumber",
        "street",
        "firstName",
        "lastName",
        "email",
        "status",
        "associationStatus",
        "likelyDuplicate",
        "signedAt",
        "verifiedAt",
        "finalizedAt",
        "deliveredAt",
        "pdfSha256",
      ] as const;
      return new NextResponse(
        [
          fields.join(","),
          ...rows.map((s) =>
            fields
              .map((f) =>
                csvCell(
                  s[f] instanceof Date ? (s[f] as Date).toISOString() : s[f],
                ),
              )
              .join(","),
          ),
        ].join("\r\n"),
        {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="proxy-manifest.csv"',
          },
        },
      );
    }
    return NextResponse.json({
      submissions: rows.map((s) => ({
        id: s.id,
        property: `${s.houseNumber} ${s.street}`,
        signer: `${s.firstName} ${s.lastName}`,
        status: s.status,
        associationStatus: s.associationStatus,
        likelyDuplicate: s.likelyDuplicate,
        deliveredAt: s.deliveredAt,
        revocationRequestedAt: s.revocationRequestedAt,
        events: s.events,
      })),
      nextCursor: rows.length === 100 ? rows.at(-1)?.id : null,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    originCheck(req);
    const p = z
      .object({
        id: z.uuid(),
        action: z.enum(["download", "delivered", "validation", "retry-email"]),
        status: z
          .enum(["pending", "accepted", "rejected", "duplicate", "revoked"])
          .optional(),
      })
      .strict()
      .safeParse(await jsonBody(req, 2048));
    if (!p.success) throw new HttpError(400, "Invalid request");
    const { id, action, status } = p.data,
      s = await db().proxySubmission.findUnique({ where: { id } });
    if (!s) throw new HttpError(404, "Unavailable");
    if (action === "download") {
      if (!s.finalPdfRef) throw new HttpError(409, "Not finalized");
      await event(id, "ADMIN_DOWNLOAD", { admin: admin.email });
      return NextResponse.json({ url: await temporaryUrl(s.finalPdfRef) });
    }
    if (action === "retry-email") {
      await deliverReceipt(id);
      await event(id, "ADMIN_RETRY_EMAIL", { admin: admin.email });
      return NextResponse.json({ ok: true });
    }
    if (action === "validation" && !status)
      throw new HttpError(400, "Status required");
    if (action === "delivered" && s.status !== "FINALIZED")
      throw new HttpError(409, "Not finalized");
    await db().$transaction([
      db().proxySubmission.update({
        where: { id },
        data:
          action === "delivered"
            ? { deliveredAt: new Date() }
            : { associationStatus: status },
      }),
      db().auditEvent.create({
        data: {
          submissionId: id,
          eventType:
            action === "delivered"
              ? "MANUALLY_MARKED_DELIVERED"
              : "ASSOCIATION_STATUS_CHANGED",
          metadata: {
            admin: admin.email,
            status: status ?? "delivered",
            previousStatus: s.associationStatus,
          },
        },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
