# AgentCheckout

> AI shopping agent that plans a cart from natural language, creates **PayPal sandbox Orders (v2)**, explains fraud/risk per order, and surfaces everything in an **AG Grid** merchant dashboard.

**PayPal AI Hackathon** entry · Due Nov 12, 2026 12:00 PM PT · [Devpost](https://paypalaihackathon.devpost.com/)

![PayPal + AI](https://img.shields.io/badge/PayPal-Orders%20v2-0070BA?logo=paypal&logoColor=white)
![AI](https://img.shields.io/badge/AI-Cart%20planner%20%2B%20risk%20narrative-8B5CF6)
![AG Grid](https://img.shields.io/badge/AG%20Grid-Orders%20dashboard-1F2937)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

## Problem

Agentic commerce is arriving faster than merchant controls. If an AI can “buy things,” teams need:

1. A coherent cart plan from messy human intent  
2. Real payment rails (not a fake “checkout” button)  
3. Explainable risk before capture  
4. An ops view of what agents are doing  

AgentCheckout is that loop — demoable end-to-end.

## Live demo

- **App:** https://paypal-agentcheckout.vercel.app
- **Health:** `/api/status` reports `paypalMode` (`mock` | `sandbox`) and `aiMode` (`llm` | `heuristic`)

> Without PayPal sandbox credentials the UI runs in a **clearly labeled Mock / demo mode** so judges can still complete the full flow. With `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET`, it hits PayPal sandbox Orders v2 + JS SDK buttons.

## Demo script (≤3 min video later)

1. Open the app → note mode badges (PayPal mock/sandbox, AI llm/heuristic).  
2. Enter: *“Order coffee pods and oat milk under $40”* → **Plan cart with AI**.  
3. Review proposed line items + rationale.  
4. **Create PayPal order** → see order id + risk/fraud brief with signal codes.  
5. Approve via PayPal Buttons (sandbox) **or** **Simulate PayPal Capture (Mock)**.  
6. Open **Orders** dashboard → AG Grid shows intent, amount, status, risk, PayPal ids.

## Architecture

```
Natural language intent
        │
        ▼
┌───────────────────┐
│  AI cart planner  │  Gemini / OpenAI / Groq / Nebius / heuristic fallback
└─────────┬─────────┘
          │ catalog SKUs + qty + rationale
          ▼
┌───────────────────┐
│ Risk engine + LLM │  score, signals, narrative for ops
│     narrative     │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ PayPal Orders v2  │  create → (buyer approve) → capture
│  + JS SDK buttons │  sandbox when creds exist; mock otherwise
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ AG Grid dashboard │  filterable order intelligence
└───────────────────┘
```

### How PayPal is used (load-bearing)

- Server: OAuth2 client-credentials → `POST /v2/checkout/orders` → `POST /v2/checkout/orders/{id}/capture` against `api-m.sandbox.paypal.com`
- Client: `@paypal/react-paypal-js` Buttons with `createOrder` returning the server-created order id
- Mock mode mirrors the same API shapes with `MOCK-ORDER-*` ids so the product UX is identical

### How AI is used (load-bearing)

- **Planner:** maps free-text intent → constrained JSON cart against a demo catalog (budget-aware)
- **Risk narrative:** turns structured fraud signals into a merchant-readable explanation
- Graceful fallback to a deterministic heuristic planner when no LLM key is present

### Sponsor tech

| Sponsor | Use |
|---------|-----|
| **AG Grid** | Orders ops dashboard (`/dashboard`) — sorting, filtering, live refresh |
| PayPal | Orders v2 + JS SDK (required) |
| Optional later | Zapier webhook on capture, APIMatic-generated clients, Render secondary host |

## Run locally

```bash
git clone https://github.com/dl88jing/paypal-agentcheckout.git
cd paypal-agentcheckout
cp .env.example .env.local
# optional: add PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET and an LLM key
npm install
npm run dev
```

Open http://localhost:3000

### Environment

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `PAYPAL_CLIENT_ID` | for sandbox | Sandbox REST app client id |
| `PAYPAL_CLIENT_SECRET` | for sandbox | Sandbox REST app secret |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | for JS SDK | Usually same as client id |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `GROQ_API_KEY` / `NEBIUS_API_KEY` | optional | LLM planner + risk narrative |

Never commit `.env.local`. Secrets are gitignored.

## API surface

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/status` | Runtime mode + missing creds |
| GET | `/api/catalog` | Demo catalog |
| POST | `/api/plan` | `{ intent }` → cart plan |
| GET/POST | `/api/orders` | List / create PayPal order + risk |
| POST | `/api/orders/:orderId/capture` | Capture payment |
| POST | `/api/risk` | Score risk for a cart |

## Judging alignment

| Criterion | How we hit it |
|-----------|----------------|
| Technological Implementation | Real PayPal Orders flow + multi-provider AI with fallbacks |
| Design | Coherent agent → risk → checkout → ops product, not a loose PoC |
| Potential Impact | Supervised agentic commerce for households / merchant ops |
| Innovation | Risk-explained agent checkout with honest mock/sandbox dual mode |
| Presentation | Hosted demo + short video (video TBD) of full path |

## License

MIT © 2026 Dylan Ler
