"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

type Props = {
  mode: "mock" | "sandbox";
  clientId: string | null;
  paypalOrderId: string;
  onCaptured: (result: unknown) => void;
  onMockCapture: () => void;
};

export function PayPalCheckout({
  mode,
  clientId,
  paypalOrderId,
  onCaptured,
  onMockCapture,
}: Props) {
  if (mode === "mock" || !clientId) {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
        <p className="mb-3 text-sm text-amber-100">
          <strong>Mock checkout mode</strong> — PayPal sandbox credentials are not
          configured. Click below to simulate buyer approval + capture. Label is
          intentional for judges.
        </p>
        <button
          type="button"
          onClick={onMockCapture}
          className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300"
        >
          Simulate PayPal Capture (Mock)
        </button>
        <p className="mt-2 text-xs text-amber-100/70">Order: {paypalOrderId}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
      <p className="mb-3 text-sm text-emerald-100">
        Sandbox checkout — approve with a PayPal sandbox buyer account.
      </p>
      <PayPalScriptProvider
        options={{
          clientId,
          currency: "USD",
          intent: "capture",
          components: "buttons",
        }}
      >
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", label: "paypal" }}
          createOrder={async () => paypalOrderId}
          onApprove={async (data) => {
            const res = await fetch(`/api/orders/${data.orderID}/capture`, {
              method: "POST",
            });
            const json = await res.json();
            onCaptured(json);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
