import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin";
import { backupTestData, testDataToolsEnabled } from "@/lib/admin/test-data";
import { failure, HttpError, jsonBody, originCheck } from "@/lib/security/http";
import { z } from "zod";
export const runtime = "nodejs";
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ enabled: testDataToolsEnabled() });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    originCheck(req);
    const body = z
      .object({
        action: z.enum(["backup", "clear"]),
        confirmation: z.string().optional(),
      })
      .strict()
      .parse(await jsonBody(req, 1024));
    if (body.action === "clear" && body.confirmation !== "CLEAR DEV TESTS")
      throw new HttpError(400, "Type CLEAR DEV TESTS to confirm");
    return NextResponse.json(
      await backupTestData(admin.email, body.action === "clear"),
    );
  } catch (e) {
    return failure(e);
  }
}
