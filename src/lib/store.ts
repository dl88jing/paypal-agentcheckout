import { randomUUID } from "crypto";

export type OrderLine = {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  currency: "USD";
};

export type RiskReport = {
  score: number; // 0-100 higher = riskier
  level: "low" | "medium" | "high";
  summary: string;
  signals: { code: string; detail: string; weight: number }[];
  recommendation: "approve" | "review" | "decline";
};

export type StoredOrder = {
  id: string;
  paypalOrderId: string;
  status: "CREATED" | "APPROVED" | "COMPLETED" | "VOIDED" | "MOCK_CAPTURED";
  mode: "mock" | "sandbox";
  intent: string;
  planRationale: string;
  lines: OrderLine[];
  amount: { currency: "USD"; value: string };
  risk?: RiskReport;
  createdAt: string;
  updatedAt: string;
  captureId?: string;
  payerEmail?: string;
};

const g = globalThis as unknown as { __agentOrders?: Map<string, StoredOrder> };
if (!g.__agentOrders) g.__agentOrders = new Map();

export function listOrders(): StoredOrder[] {
  return Array.from(g.__agentOrders!.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getOrder(id: string) {
  return g.__agentOrders!.get(id);
}

export function getByPaypalId(paypalOrderId: string) {
  return listOrders().find((o) => o.paypalOrderId === paypalOrderId);
}

export function upsertOrder(order: StoredOrder) {
  g.__agentOrders!.set(order.id, order);
  return order;
}

export function createLocalId() {
  return `ac_${randomUUID().slice(0, 8)}`;
}
