import { getPayPalMode } from "./mode";
import type { OrderLine } from "./store";

const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${SANDBOX_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function totalFromLines(lines: OrderLine[]) {
  const sum = lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
  return sum.toFixed(2);
}

export function buildPurchaseUnits(lines: OrderLine[], description: string) {
  const value = totalFromLines(lines);
  const itemTotal = value;
  return [
    {
      description: description.slice(0, 120),
      amount: {
        currency_code: "USD",
        value,
        breakdown: {
          item_total: { currency_code: "USD", value: itemTotal },
        },
      },
      items: lines.map((l) => ({
        name: l.name.slice(0, 120),
        sku: l.sku,
        quantity: String(l.quantity),
        unit_amount: {
          currency_code: "USD",
          value: l.unitPrice.toFixed(2),
        },
        category: "PHYSICAL_GOODS" as const,
      })),
    },
  ];
}

export async function createPayPalOrder(params: {
  lines: OrderLine[];
  description: string;
}): Promise<{ id: string; status: string; raw: unknown; mode: "mock" | "sandbox" }> {
  const mode = getPayPalMode();
  const purchase_units = buildPurchaseUnits(params.lines, params.description);

  if (mode === "mock") {
    const id = `MOCK-ORDER-${Date.now().toString(36).toUpperCase()}`;
    return {
      id,
      status: "CREATED",
      mode: "mock",
      raw: {
        id,
        status: "CREATED",
        intent: "CAPTURE",
        purchase_units,
        mock: true,
      },
    };
  }

  const token = await getAccessToken();
  const res = await fetch(`${SANDBOX_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units,
      application_context: {
        brand_name: "AgentCheckout",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
  });
  const raw = await res.json();
  if (!res.ok) {
    throw new Error(`PayPal create order failed: ${JSON.stringify(raw)}`);
  }
  return {
    id: (raw as { id: string }).id,
    status: (raw as { status: string }).status,
    raw,
    mode: "sandbox",
  };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
  captureId?: string;
  payerEmail?: string;
  raw: unknown;
  mode: "mock" | "sandbox";
}> {
  const mode = getPayPalMode();
  if (mode === "mock" || orderId.startsWith("MOCK-")) {
    const captureId = `MOCK-CAP-${Date.now().toString(36).toUpperCase()}`;
    return {
      id: orderId,
      status: "COMPLETED",
      captureId,
      payerEmail: "buyer@example.com",
      mode: "mock",
      raw: {
        id: orderId,
        status: "COMPLETED",
        mock: true,
        purchase_units: [
          {
            payments: {
              captures: [{ id: captureId, status: "COMPLETED" }],
            },
          },
        ],
        payer: { email_address: "buyer@example.com" },
      },
    };
  }

  const token = await getAccessToken();
  const res = await fetch(`${SANDBOX_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });
  const raw = await res.json();
  if (!res.ok) {
    throw new Error(`PayPal capture failed: ${JSON.stringify(raw)}`);
  }
  const typed = raw as {
    id: string;
    status: string;
    payer?: { email_address?: string };
    purchase_units?: {
      payments?: { captures?: { id: string }[] };
    }[];
  };
  return {
    id: typed.id,
    status: typed.status,
    captureId: typed.purchase_units?.[0]?.payments?.captures?.[0]?.id,
    payerEmail: typed.payer?.email_address,
    raw,
    mode: "sandbox",
  };
}
