"use client";

import { useEffect, useState } from "react";

type Status = {
  paypalMode: "mock" | "sandbox";
  aiMode: "llm" | "heuristic";
  missing: { paypal: string[]; ai: string[] };
};

export function ModeBadge() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
        Checking runtime…
      </div>
    );
  }

  const paypalColor =
    status.paypalMode === "sandbox"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
      : "bg-amber-500/20 text-amber-200 border-amber-400/30";
  const aiColor =
    status.aiMode === "llm"
      ? "bg-sky-500/20 text-sky-200 border-sky-400/30"
      : "bg-violet-500/20 text-violet-200 border-violet-400/30";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${paypalColor}`}
      >
        PayPal: {status.paypalMode === "sandbox" ? "Sandbox (live API)" : "Mock / demo"}
      </span>
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${aiColor}`}
      >
        AI: {status.aiMode === "llm" ? "LLM planner" : "Heuristic planner"}
      </span>
    </div>
  );
}
