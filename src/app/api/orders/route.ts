import { NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal";
import { scoreOrderRisk } from "@/lib/risk";
import {
  createLocalId,
  listOrders,
  upsertOrder,
  type OrderLine,
} from "@/lib/store";
import { explainRiskWithAi } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ orders: listOrders() });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      intent?: string;
      rationale?: string;
      lines?: OrderLine[];
    };
    const intent = (body.intent || "").trim();
    const lines = body.lines || [];
    if (!intent || lines.length === 0) {
      return NextResponse.json(
        { error: "intent and lines required" },
        { status: 400 },
      );
    }

    const created = await createPayPalOrder({
      lines,
      description: `AgentCheckout: ${intent}`,
    });

    const amountValue = lines
      .reduce((a, l) => a + l.unitPrice * l.quantity, 0)
      .toFixed(2);

    const risk = scoreOrderRisk({
      intent,
      lines,
      amountValue,
      mode: created.mode,
    });
    const narrative = await explainRiskWithAi(risk, intent);

    const now = new Date().toISOString();
    const order = upsertOrder({
      id: createLocalId(),
      paypalOrderId: created.id,
      status: "CREATED",
      mode: created.mode,
      intent,
      planRationale: body.rationale || "",
      lines,
      amount: { currency: "USD", value: amountValue },
      risk: { ...risk, summary: `${risk.summary} ${narrative}`.slice(0, 600) },
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      order,
      paypal: created.raw,
      clientId:
        created.mode === "sandbox" ? process.env.PAYPAL_CLIENT_ID : null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || "create order failed" },
      { status: 500 },
    );
  }
}
