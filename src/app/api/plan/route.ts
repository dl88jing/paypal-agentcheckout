import { NextResponse } from "next/server";
import { planCart } from "@/lib/ai";
import { findById } from "@/data/catalog";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { intent?: string };
    const intent = (body.intent || "").trim();
    if (!intent) {
      return NextResponse.json({ error: "intent required" }, { status: 400 });
    }

    const { plan, provider } = await planCart(intent);
    const lines = plan.items
      .map((i) => {
        const item = findById(i.sku);
        if (!item) return null;
        return {
          sku: item.id,
          name: item.name,
          quantity: i.quantity,
          unitPrice: item.price,
          currency: "USD" as const,
          reason: i.reason,
          imageEmoji: item.imageEmoji,
          category: item.category,
        };
      })
      .filter(Boolean);

    const total = lines.reduce(
      (acc, l) => acc! + l!.unitPrice * l!.quantity,
      0,
    );

    return NextResponse.json({
      intent,
      provider,
      plan,
      lines,
      amount: { currency: "USD", value: total!.toFixed(2) },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || "plan failed" },
      { status: 500 },
    );
  }
}
