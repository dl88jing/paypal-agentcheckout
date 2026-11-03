import type { OrderLine, RiskReport } from "./store";

export function scoreOrderRisk(params: {
  intent: string;
  lines: OrderLine[];
  amountValue: string;
  mode: "mock" | "sandbox";
}): RiskReport {
  const signals: RiskReport["signals"] = [];
  let score = 8;

  const total = Number(params.amountValue);
  const qty = params.lines.reduce((a, l) => a + l.quantity, 0);
  const categories = new Set(
    params.lines.map((l) => l.sku.split("-")[1] || "misc"),
  );

  if (total > 150) {
    score += 28;
    signals.push({
      code: "HIGH_TICKET",
      detail: `Order total $${total.toFixed(2)} exceeds typical agent cart threshold ($150).`,
      weight: 28,
    });
  } else if (total > 75) {
    score += 12;
    signals.push({
      code: "ELEVATED_TICKET",
      detail: `Order total $${total.toFixed(2)} is elevated for an unattended agent checkout.`,
      weight: 12,
    });
  } else {
    signals.push({
      code: "TICKET_OK",
      detail: `Order total $${total.toFixed(2)} is within normal agent spend band.`,
      weight: 0,
    });
  }

  if (qty >= 6) {
    score += 18;
    signals.push({
      code: "BULK_QTY",
      detail: `Combined quantity ${qty} looks bulk-like for a household agent.`,
      weight: 18,
    });
  }

  const giftish = params.lines.some(
    (l) => /gift/i.test(l.name) || l.sku.includes("gift"),
  );
  if (giftish && total > 20) {
    score += 10;
    signals.push({
      code: "GIFT_CARD_MIX",
      detail: "Cart includes gift-card style items which are higher fraud abuse targets.",
      weight: 10,
    });
  }

  if (/urgent|asap|immediately|wire|crypto/i.test(params.intent)) {
    score += 22;
    signals.push({
      code: "URGENCY_LANGUAGE",
      detail: "Buyer intent contains urgency / high-risk language.",
      weight: 22,
    });
  }

  if (categories.size >= 4) {
    score += 14;
    signals.push({
      code: "CATEGORY_SPRAWL",
      detail: "Cart spans many unrelated categories — possible scraping / testing pattern.",
      weight: 14,
    });
  }

  if (params.mode === "mock") {
    signals.push({
      code: "MOCK_CHANNEL",
      detail: "Running in clearly labeled mock mode — no real money movement.",
      weight: 0,
    });
  } else {
    signals.push({
      code: "SANDBOX_CHANNEL",
      detail: "PayPal sandbox Orders v2 channel — real API, fake money.",
      weight: 0,
    });
  }

  score = Math.max(0, Math.min(99, score));
  const level: RiskReport["level"] =
    score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  const recommendation: RiskReport["recommendation"] =
    level === "high" ? "review" : level === "medium" ? "review" : "approve";

  const summary =
    level === "low"
      ? "Low fraud risk. Agent cart looks consistent with household shopping intent."
      : level === "medium"
        ? "Medium risk. Recommend human glance before capture — amount or mix is unusual."
        : "High risk. Hold for review; do not auto-capture without confirmation.";

  return { score, level, summary, signals, recommendation };
}
