import { CATALOG, type CatalogItem } from "@/data/catalog";
import { z } from "zod";

export const PlanSchema = z.object({
  rationale: z.string(),
  budget: z.number().nullable(),
  items: z.array(
    z.object({
      sku: z.string(),
      quantity: z.number().int().positive().max(10),
      reason: z.string(),
    }),
  ),
  notes: z.string().optional(),
});

export type CartPlan = z.infer<typeof PlanSchema>;

function catalogBrief() {
  return CATALOG.map(
    (i) =>
      `- ${i.id} | ${i.name} | $${i.price.toFixed(2)} | ${i.category} | tags: ${i.tags.join(",")}`,
  ).join("\n");
}

function heuristicPlan(intent: string): CartPlan {
  const lower = intent.toLowerCase();
  const budgetMatch = lower.match(/under\s*\$?\s*(\d+(?:\.\d+)?)/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : null;

  const scored = CATALOG.map((item) => {
    let score = 0;
    for (const tag of item.tags) {
      if (lower.includes(tag)) score += 3;
    }
    if (lower.includes(item.category.toLowerCase())) score += 2;
    if (lower.includes(item.name.toLowerCase().split(" ")[0])) score += 2;
    if (/coffee|espresso|latte|pods/.test(lower) && item.tags.includes("coffee"))
      score += 5;
    if (/gift/.test(lower) && item.tags.includes("gift")) score += 5;
    if (
      /desk|office|work/.test(lower) &&
      /office|home|electronics/i.test(item.category)
    )
      score += 3;
    if (
      /fitness|protein|run/.test(lower) &&
      item.tags.some((t) =>
        ["fitness", "running", "protein"].includes(t),
      )
    )
      score += 4;
    if (/headphone|audio|music/.test(lower) && item.tags.includes("headphones"))
      score += 6;
    return { item, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked: { item: CatalogItem; quantity: number; reason: string }[] = [];
  let spent = 0;
  const candidates =
    scored.length > 0
      ? scored
      : CATALOG.slice(0, 3).map((item) => ({ item, score: 1 }));

  for (const c of candidates) {
    if (picked.length >= 4) break;
    const qty = 1;
    const next = spent + c.item.price * qty;
    if (budget != null && next > budget) continue;
    picked.push({
      item: c.item,
      quantity: qty,
      reason: `Matched intent signals (score ${c.score}).`,
    });
    spent = next;
  }

  if (picked.length === 0 && candidates[0]) {
    picked.push({
      item: candidates[0].item,
      quantity: 1,
      reason: "Closest affordable match within catalog.",
    });
  }

  return {
    rationale:
      budget != null
        ? `Heuristic planner assembled a cart under $${budget.toFixed(2)} from catalog matches.`
        : "Heuristic planner assembled a cart from keyword matches against the demo catalog.",
    budget,
    items: picked.map((p) => ({
      sku: p.item.id,
      quantity: p.quantity,
      reason: p.reason,
    })),
    notes: "Running without an LLM key — deterministic heuristic planner.",
  };
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  intent: string,
): Promise<string> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are AgentCheckout, an AI shopping agent for a demo catalog.
Return ONLY JSON matching: {"rationale":string,"budget":number|null,"items":[{"sku":string,"quantity":number,"reason":string}],"notes":string}
Rules: only use SKUs from the catalog; respect budget if stated; keep 1-5 items; quantities 1-3; prefer coherent carts.`,
        },
        {
          role: "user",
          content: `Buyer request: ${intent}\n\nCatalog:\n${catalogBrief()}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`LLM error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content || "{}";
}

async function callGemini(apiKey: string, intent: string): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are AgentCheckout. Return ONLY JSON:
{"rationale":string,"budget":number|null,"items":[{"sku":string,"quantity":number,"reason":string}],"notes":string}
Only use catalog SKUs. Respect budget. 1-5 items.

Buyer request: ${intent}

Catalog:
${catalogBrief()}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

function parsePlan(text: string): CartPlan {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const json = JSON.parse(cleaned);
  const parsed = PlanSchema.parse(json);
  const valid = parsed.items.filter((i) => CATALOG.some((c) => c.id === i.sku));
  if (valid.length === 0) throw new Error("LLM returned no valid SKUs");
  return { ...parsed, items: valid };
}

type Provider = { name: string; run: (intent: string) => Promise<string> };

function providers(): Provider[] {
  const list: Provider[] = [];
  if (process.env.GEMINI_API_KEY) {
    list.push({
      name: "gemini",
      run: (intent) => callGemini(process.env.GEMINI_API_KEY!, intent),
    });
  }
  if (process.env.OPENAI_API_KEY) {
    list.push({
      name: "openai",
      run: (intent) =>
        callOpenAICompatible(
          process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
          process.env.OPENAI_API_KEY!,
          process.env.OPENAI_MODEL || "gpt-4o-mini",
          intent,
        ),
    });
  }
  if (process.env.GROQ_API_KEY) {
    list.push({
      name: "groq",
      run: (intent) =>
        callOpenAICompatible(
          "https://api.groq.com/openai/v1",
          process.env.GROQ_API_KEY!,
          process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          intent,
        ),
    });
  }
  if (process.env.NEBIUS_API_KEY) {
    list.push({
      name: "nebius",
      run: (intent) =>
        callOpenAICompatible(
          process.env.NEBIUS_BASE_URL ||
            "https://api.tokenfactory.nebius.com/v1",
          process.env.NEBIUS_API_KEY!,
          process.env.NEBIUS_MODEL || "meta-llama/Meta-Llama-3.1-8B-Instruct",
          intent,
        ),
    });
  }
  return list;
}

export async function planCart(intent: string): Promise<{
  plan: CartPlan;
  provider: string;
}> {
  const errors: string[] = [];
  for (const p of providers()) {
    try {
      const text = await p.run(intent);
      return { plan: parsePlan(text), provider: p.name };
    } catch (err) {
      const msg = (err as Error).message;
      console.error(`Provider ${p.name} failed:`, msg);
      errors.push(`${p.name}: ${msg}`);
    }
  }

  const plan = heuristicPlan(intent);
  if (errors.length) {
    plan.notes = `LLM providers failed; used heuristic. ${errors[0].slice(0, 180)}`;
    return { plan, provider: "heuristic-fallback" };
  }
  return { plan, provider: "heuristic" };
}

export async function explainRiskWithAi(riskJson: unknown, intent: string) {
  const fallback = () =>
    `Structured risk for “${intent}”: level=${(riskJson as { level?: string })?.level}, score=${(riskJson as { score?: number })?.score}. Review signals before capture.`;

  for (const p of providers()) {
    try {
      if (p.name === "gemini") {
        const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Write a concise 2-3 sentence fraud/risk explanation a merchant ops person would trust. Intent: ${intent}. Risk JSON: ${JSON.stringify(riskJson)}`,
                  },
                ],
              },
            ],
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const text = await callOpenAICompatible(
          p.name === "groq"
            ? "https://api.groq.com/openai/v1"
            : p.name === "nebius"
              ? process.env.NEBIUS_BASE_URL ||
                "https://api.tokenfactory.nebius.com/v1"
              : process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
          p.name === "groq"
            ? process.env.GROQ_API_KEY!
            : p.name === "nebius"
              ? process.env.NEBIUS_API_KEY!
              : process.env.OPENAI_API_KEY!,
          p.name === "groq"
            ? process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
            : p.name === "nebius"
              ? process.env.NEBIUS_MODEL ||
                "meta-llama/Meta-Llama-3.1-8B-Instruct"
              : process.env.OPENAI_MODEL || "gpt-4o-mini",
          `Write 2-3 sentences explaining this payment risk for ops. Intent=${intent}. Risk=${JSON.stringify(riskJson)}. Return plain text only.`,
        );
        if (text) return text.replace(/```[\s\S]*?```/g, "").trim();
      }
    } catch (err) {
      console.error(`Risk narrative via ${p.name} failed`, err);
    }
  }
  return fallback();
}
