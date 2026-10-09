# LaunchLens AI

A web platform that guides an entrepreneur from a raw business idea to a running business, with AI at every step. Built for the "AI Enterprise Solutions" hackathon track. The UI is in Azerbaijani; code and comments are in English.

> Status: **Phases 1-3** are implemented (setup, schema, auth, onboarding, Idea Studio with branding images, Business Analysis). Dashboard and Network pages are placeholders until their phases land.

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

| Variable | Needed from | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Phase 1 | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Phase 1 | Public key used by the browser and server clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Phase 1 (seed helper), Phase 2+ | Server-only admin key. Never expose it to the client |
| `OPENAI_API_KEY`, `LLM_MODEL` | Phase 2 | OpenAI GPT API, called only from route handlers |
| `IMAGE_PROVIDER`, `IMAGE_MODEL`, `IMAGE_API_KEY` | Phase 2 | Logo and banner generation with Gemini (`IMAGE_PROVIDER=openai` is also supported) |
| `SEARCH_PROVIDER`, `SEARCH_API_KEY` | Phase 3 | Web search for competitor research |

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

## Architecture

```
app/
  (auth)/login, register     Supabase email/password auth + demo login
  api/auth/register          Creates confirmed users (no email verification step)
  api/studio, api/branding   Idea Studio agent and branding image generation
  api/analysis               Business Analysis agent (saved business, form or PDF upload)
  onboarding/                7-step questionnaire, saved to profiles
  (app)/                     Authenticated shell: sidebar + chat widget
    studio, analysis, dashboard, network, profile/[id]
components/
  ui/                        shadcn-style primitives
  auth/, onboarding/, layout/, chat/, studio/, analysis/
lib/
  supabase/                  browser, server, admin and middleware clients
  ai/                        prompts, Zod schemas, LLM helper, Studio and Branding agents, image generation
  finance/                   forecast arithmetic (done in code, not by the LLM)
  analysis/                  plan-to-text helpers and PDF text extraction
  places.ts                  known locations with fixed map coordinates
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

### How sources are enforced

The Analysis agent only sees sources that the server numbered for it (`[M1]` for `market_data` rows, `[W1]` for web results). After the model answers, code drops any citation whose id was not provided, replaces the value of each market figure with the value stored in the database, and marks every figure without a valid source as an estimate. Figures quoted from the user's own plan are labelled "plandan". Without `SEARCH_API_KEY` the web search returns nothing and competitors are described by type instead of by name.
