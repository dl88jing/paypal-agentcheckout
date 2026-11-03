import { NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal";
import { getByPaypalId, upsertOrder } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await ctx.params;
    const captured = await capturePayPalOrder(orderId);
    const existing = getByPaypalId(orderId);
    if (existing) {
      upsertOrder({
        ...existing,
        status:
          captured.mode === "mock" ? "MOCK_CAPTURED" : "COMPLETED",
        captureId: captured.captureId,
        payerEmail: captured.payerEmail,
        updatedAt: new Date().toISOString(),
      });
    }
    return NextResponse.json({
      capture: captured,
      order: getByPaypalId(orderId) || null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || "capture failed" },
      { status: 500 },
    );
  }
}
