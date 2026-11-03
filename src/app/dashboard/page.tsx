import { OrdersGrid } from "@/components/OrdersGrid";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">
          Sponsor lane · AG Grid
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Merchant order intelligence
        </h1>
        <p className="mt-2 max-w-3xl text-slate-300">
          Every agent checkout lands here with PayPal order IDs, capture status,
          and an explainable fraud/risk score — built for ops teams supervising
          agentic commerce.
        </p>
      </section>
      <OrdersGrid />
    </div>
  );
}
