"use client";

import { useMemo, useState } from "react";
import { PayPalCheckout } from "@/components/PayPalCheckout";

type Line = {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  currency: "USD";
  reason?: string;
  imageEmoji?: string;
  category?: string;
};

type PlanResponse = {
  intent: string;
  provider: string;
  plan: { rationale: string; budget: number | null; notes?: string };
  lines: Line[];
  amount: { currency: "USD"; value: string };
};

type CreatedOrder = {
  order: {
    id: string;
    paypalOrderId: string;
    status: string;
    mode: "mock" | "sandbox";
    risk?: {
      score: number;
      level: string;
      summary: string;
      signals: { code: string; detail: string; weight: number }[];
      recommendation: string;
    };
    amount: { value: string };
  };
  clientId: string | null;
};

const EXAMPLES = [
  "Order coffee pods and oat milk under $40",
  "Gift under $30 for a tea lover",
  "Desk setup basics under $100 — lamp and notebook",
  "Running socks and plant protein for training week",
];

export default function HomePage() {
  const [intent, setIntent] = useState(EXAMPLES[0]);
  const [planning, setPlanning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [created, setCreated] = useState<CreatedOrder | null>(null);
  const [captureResult, setCaptureResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const totalLabel = useMemo(() => {
    if (!plan) return null;
    return `$${plan.amount.value}`;
  }, [plan]);

  async function runPlan() {
    setError(null);
    setCreated(null);
    setCaptureResult(null);
    setPlanning(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Plan failed");
      setPlan(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPlanning(false);
    }
  }

  async function createOrder() {
    if (!plan) return;
    setError(null);
    setCreating(true);
    setCaptureResult(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: plan.intent,
          rationale: plan.plan.rationale,
          lines: plan.lines.map((l) => ({
            sku: l.sku,
            name: l.name,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            currency: "USD" as const,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create order failed");
      setCreated(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function mockCapture() {
    if (!created) return;
    const res = await fetch(
      `/api/orders/${created.order.paypalOrderId}/capture`,
      { method: "POST" },
    );
    const data = await res.json();
    setCaptureResult(data);
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-2xl shadow-blue-950/30">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-300/80">
            PayPal AI Hackathon · Agentic commerce
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Tell the agent what to buy.
            <span className="block text-sky-300">It plans, risks, and checks out.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            AgentCheckout turns a natural-language shopping request into a coherent
            cart, creates a <strong>PayPal Orders v2</strong> payment, explains
            fraud/risk signals, and records everything in an AG Grid ops dashboard.
          </p>

          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-slate-200">
              Shopping intent
            </label>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none ring-sky-400/40 focus:ring"
              placeholder="e.g. Order coffee pods under $40"
            />
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setIntent(ex)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:bg-white/10"
                >
                  {ex}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={runPlan}
                disabled={planning || !intent.trim()}
                className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50"
              >
                {planning ? "Planning cart…" : "1. Plan cart with AI"}
              </button>
              <button
                type="button"
                onClick={createOrder}
                disabled={!plan || creating}
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {creating ? "Creating PayPal order…" : "2. Create PayPal order"}
              </button>
            </div>
            {error && (
              <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/40 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            How it scores for judges
          </h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              <strong className="text-white">PayPal is load-bearing</strong> — Orders
              v2 create + capture (JS SDK buttons in sandbox).
            </li>
            <li>
              <strong className="text-white">AI is load-bearing</strong> — NL → cart
              plan + narrative risk explanation.
            </li>
            <li>
              <strong className="text-white">AG Grid sponsor lane</strong> — live order
              intelligence table.
            </li>
            <li>
              <strong className="text-white">Honest dual mode</strong> — labeled mock
              without creds; real sandbox when env vars exist.
            </li>
          </ul>
          <a
            href="/dashboard"
            className="inline-flex rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Open orders dashboard →
          </a>
        </aside>
      </section>

      {plan && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Proposed cart</h2>
                <p className="text-sm text-slate-400">
                  Planner: <span className="text-sky-300">{plan.provider}</span>
                  {totalLabel ? ` · ${totalLabel}` : null}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-300">{plan.plan.rationale}</p>
            {plan.plan.notes && (
              <p className="mt-2 text-xs text-slate-500">{plan.plan.notes}</p>
            )}
            <ul className="mt-4 space-y-3">
              {plan.lines.map((l) => (
                <li
                  key={l.sku}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{l.imageEmoji || "📦"}</span>
                    <div>
                      <p className="font-medium text-white">
                        {l.name}{" "}
                        <span className="text-slate-400">×{l.quantity}</span>
                      </p>
                      <p className="text-xs text-slate-400">{l.reason}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-200">
                    ${(l.unitPrice * l.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            {created?.order.risk && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold text-white">Risk / fraud brief</h2>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                      created.order.risk.level === "low"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : created.order.risk.level === "medium"
                          ? "bg-amber-500/20 text-amber-200"
                          : "bg-rose-500/20 text-rose-200"
                    }`}
                  >
                    {created.order.risk.level} · score {created.order.risk.score}
                  </span>
                  <span className="text-xs text-slate-400">
                    Recommend: {created.order.risk.recommendation}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {created.order.risk.summary}
                </p>
                <ul className="mt-4 space-y-2">
                  {created.order.risk.signals.map((s) => (
                    <li
                      key={s.code}
                      className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-300"
                    >
                      <span className="font-mono text-sky-300">{s.code}</span>{" "}
                      (+{s.weight}) — {s.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {created && (
              <PayPalCheckout
                mode={created.order.mode}
                clientId={created.clientId}
                paypalOrderId={created.order.paypalOrderId}
                onCaptured={setCaptureResult}
                onMockCapture={mockCapture}
              />
            )}

            {captureResult != null && (
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
                <h3 className="font-semibold text-emerald-100">Capture complete</h3>
                <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-950/70 p-3 text-xs text-emerald-100/90">
                  {JSON.stringify(captureResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
