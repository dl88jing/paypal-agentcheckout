export type RuntimeMode = "mock" | "sandbox";

export function getPayPalMode(): RuntimeMode {
  const id = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (id && secret && id !== "mock" && secret !== "mock") {
    return "sandbox";
  }
  return "mock";
}

export function getAiMode(): "llm" | "heuristic" {
  if (
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.NEBIUS_API_KEY
  ) {
    return "llm";
  }
  return "heuristic";
}

export function publicClientId(): string | null {
  if (getPayPalMode() === "sandbox") {
    return process.env.PAYPAL_CLIENT_ID || null;
  }
  // Mock mode still exposes a placeholder for UI labels
  return process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || null;
}

export function statusPayload() {
  const paypalMode = getPayPalMode();
  const aiMode = getAiMode();
  return {
    ok: true,
    app: "AgentCheckout",
    paypalMode,
    aiMode,
    paypalConfigured: paypalMode === "sandbox",
    aiConfigured: aiMode === "llm",
    clientIdPresent: Boolean(process.env.PAYPAL_CLIENT_ID),
    missing: {
      paypal:
        paypalMode === "mock"
          ? ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"]
          : [],
      ai:
        aiMode === "heuristic"
          ? ["OPENAI_API_KEY or GEMINI_API_KEY (optional — heuristic planner works)"]
          : [],
    },
    timestamp: new Date().toISOString(),
  };
}
