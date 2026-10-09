# LaunchLens AI

A web platform that guides an entrepreneur from a raw business idea to a running business, with AI at every step. Built for the "AI Enterprise Solutions" hackathon track. The UI is in Azerbaijani; code and comments are in English.

| Section | What it does |
|---|---|
| Onboarding | Seven questions after sign-up; the answers become context for every AI agent |
| Studiya (Idea Studio) | Turns an idea into a business plan, financial forecast, location suggestions on a map, names, slogans, logos and a banner |
| Analiz (Business Analysis) | Scores a plan's investment readiness from a saved business, a form or a PDF, with sources for every market figure |
| Dashboard | Income and expense tracking with charts and an AI assistant that adds transactions and answers questions |
| Şəbəkə (Network) | AI-recommended entrepreneurs with a reason for each, plus realtime 1:1 chat |

Enterprise angle: banks and incubators can use the same analysis to evaluate SME loan applications and startup plans faster.

**Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4 with shadcn-style components, Recharts, Leaflet, Supabase (Auth, Postgres, Realtime, Storage), OpenAI for the agents, Gemini for images, Tavily for web search.

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

1. Create a project at https://supabase.com/dashboard.
2. **Project Settings → API**: copy the project URL, the `anon` key and the `service_role` key.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill it in.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public key used by the browser and server clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only admin key (sign-up, image and PDF storage). Never expose it to the client |
| `OPENAI_API_KEY`, `LLM_MODEL` | Yes | OpenAI model used by all five agents, called only from route handlers |
| `IMAGE_PROVIDER`, `IMAGE_MODEL`, `IMAGE_API_KEY` | No | Logo and banner generation (`gemini` or `openai`). Without a working key the app shows SVG placeholders |
| `SEARCH_PROVIDER`, `SEARCH_API_KEY` | No | Web search for competitor research (`tavily`). Without a key competitors are described by type, not by name |

### 4. Run the migration and the seed

In the Supabase dashboard open **SQL Editor** and run, in this order:

1. `supabase/migrations/0001_init.sql` — tables, indexes, RLS policies, storage buckets, realtime.
2. `supabase/seed.sql` — demo users, market data, the "Nur Cosmetics" business with 6 months of transactions, demo messages.

Both files are safe to re-run. The market data rows are **demo placeholders** and must be replaced with real figures (stat.gov.az, World Bank) before the pitch.

Demo login: `demo@launchlens.az` / `demo12345` (also available as the "Demo hesabı ilə daxil ol" button). If that login fails after seeding, run `npm run seed:demo` to reset the demo password through the admin API.

### 5. Start the app

```bash
npm run dev
```

Open http://localhost:3000.

### 6. Deploy to Vercel

1. Import the GitHub repository in Vercel.
2. Add every variable from `.env.local` under **Settings → Environment Variables** (the file itself is not deployed), then redeploy.
3. Under **Settings → Functions**, pick the function region closest to your Supabase project's region. Each page load makes at least one Supabase query, so a distant region adds noticeable delay.
4. Share the production domain, not a `...-git-main-...` preview URL: preview URLs require a Vercel login unless Deployment Protection is turned off.

PDF uploads are capped at 4 MB because Vercel rejects request bodies above 4.5 MB.

## Before the demo

- Replace the demo rows in `market_data` with real figures; their source names start with "DEMO".
- Check that image generation works with your key. If the Brendinq tab shows a notice about sample visuals, the image API rejected the request (for example, no quota on a free Gemini key).
- Sign in once with the demo account and open Studiya → Nur Cosmetics, Analiz → "Nəticəyə bax" and the Dashboard, so the saved plan and analysis are there as a fallback if the network is slow on stage.
- The current month's KPIs compare a partial month with a full one, so early in a month they show large negative changes.

## Architecture

```
app/
  (auth)/login, register     Supabase email/password auth + demo login
  api/auth/register          Creates confirmed users (no email verification step)
  api/studio, api/branding   Idea Studio agent and branding image generation
  api/analysis               Business Analysis agent (saved business, form or PDF upload)
  api/assistant              Dashboard assistant: streaming tool-use loop
  api/matching               Matching agent: SQL pre-filter, then LLM ranking with reasons
  onboarding/                7-step questionnaire, saved to profiles
  (app)/                     Authenticated shell: sidebar + chat widget
    studio, analysis, dashboard, network, profile/[id]
components/
  ui/                        shadcn-style primitives
  auth/, onboarding/, layout/, chat/, studio/, analysis/, dashboard/, network/
lib/
  supabase/                  browser, server, admin and middleware clients
  ai/                        prompts, Zod schemas, LLM helper, Studio and Branding agents, image generation
  finance/                   forecast and dashboard arithmetic (done in code, not by the LLM)
  analysis/                  plan-to-text helpers and PDF text extraction
  places.ts                  known locations with fixed map coordinates
  network.ts                 public profile fields, related tracks, candidate ordering
  constants.ts               tracks, stages, budgets, locations (Azerbaijani labels)
types/                       shared row and JSON types
supabase/                    SQL migration and seed
middleware.ts                refreshes the session and guards routes
```

- **Auth and routing:** the middleware redirects signed-out users to `/login`. The `(app)` layout sends users who have not finished onboarding to `/onboarding`; after onboarding they land on `/studio`, `/analysis` or `/dashboard` depending on their stage.
- **Data access:** Row Level Security restricts every table to its owner, except that profiles are readable by all signed-in users and messages by their sender and receiver.
- **AI:** all LLM, image and search calls live in `lib/ai/` and run only inside route handlers under `app/api/`. Prompts are in `lib/ai/prompts.ts`. Every agent returns JSON validated with Zod and retries once with the validation error.

## Where the AI is used

| Feature | Agent | What the model does | What code does |
|---|---|---|---|
| Idea Studio | Studio agent (`lib/ai/studio.ts`) | Asks 2-3 clarifying questions, then writes the plan, cost items, 12-month revenue estimate, location picks, names and slogans | Totals, monthly projection and break-even (`lib/finance/forecast.ts`); map coordinates from a fixed list (`lib/places.ts`) |
| Branding | Branding agent (`lib/ai/branding.ts`) | Generates 2 logos and a banner from prompts built out of the plan | Stores images in Supabase Storage; falls back to SVG placeholders when no image API is available |
| Business Analysis | Analysis agent (`lib/ai/analysis.ts`) | Scores investment readiness and market fit, writes SWOT, budget check, competitors and recommendations, citing numbered sources | Selects `market_data` rows by sector, runs `webSearch`, validates every cited source id, takes market figures from the database row, and labels unsourced numbers "təxmini" |
| Dashboard | Dashboard assistant (`app/api/assistant`, `lib/ai/assistant-tools.ts`) | Chooses a tool, then explains the result in Azerbaijani; parses transactions from natural language | Every sum, percentage, comparison and what-if scenario (`lib/finance/dashboard.ts`); a parsed transaction is saved only after the user confirms it on a card |
| Network | Matching agent (`lib/ai/matching.ts`) | Ranks the best 5 of ~15 candidates and writes a one-sentence reason for each | Pre-filters candidates in SQL (own and related tracks, excluding the user), checks returned ids against the candidate list, and falls back to a rule-based order if the model fails |

### Chat

The floating chat widget reads and writes the `messages` table directly from the browser under Row Level Security (only the sender and receiver can read a message, only the sender can insert it, only the receiver can mark it read). New messages arrive through a Supabase Realtime subscription filtered on `receiver_id`. Any page can open a thread through `useChat().openChatWith(userId)`.

### How the dashboard assistant stays out of the math

The assistant has six tools: `get_summary`, `get_expenses_by_category`, `compare_periods`, `get_monthly_trend`, `simulate_price_change` and `add_transaction`. The route handler runs a streaming loop: the model picks a tool, TypeScript computes the result from the business's transactions, and the model turns that result into a short answer. `add_transaction` never writes to the database; it returns a proposal that the interface shows as an "Əlavə edilsin?" card, and the row is inserted only when the user confirms. KPIs and charts are derived from the same functions on the client, so they update as soon as a transaction changes.

### How sources are enforced

The Analysis agent only sees sources that the server numbered for it (`[M1]` for `market_data` rows, `[W1]` for web results). After the model answers, code drops any citation whose id was not provided, replaces the value of each market figure with the value stored in the database, and marks every figure without a valid source as an estimate. Figures quoted from the user's own plan are labelled "plandan". Without `SEARCH_API_KEY` the web search returns nothing and competitors are described by type instead of by name.
