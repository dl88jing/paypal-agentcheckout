import { NextResponse } from "next/server";
import { scoreOrderRisk } from "@/lib/risk";
import { explainRiskWithAi } from "@/lib/ai";
import type { OrderLine } from "@/lib/store";
import { getPayPalMode } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    intent?: string;
    lines?: OrderLine[];
    amountValue?: string;
  };
  const intent = body.intent || "";
  const lines = body.lines || [];
  const amountValue =
    body.amountValue ||
    lines.reduce((a, l) => a + l.unitPrice * l.quantity, 0).toFixed(2);
  const risk = scoreOrderRisk({
    intent,
    lines,
    amountValue,
    mode: getPayPalMode(),
  });
  const narrative = await explainRiskWithAi(risk, intent);
  return NextResponse.json({ risk, narrative });
}
