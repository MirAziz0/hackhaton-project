# Growenta

**Live demo:** https://hackhaton-project-seven.vercel.app/

Growenta takes an entrepreneur in Azerbaijan from a one-sentence idea to a running business: a plan, a checked budget, a place to open, a brand, bookkeeping and people to work with. The interface is in English and Azerbaijani (ENG / AZ switch); the AI answers in the language you pick.

## The problem and the outcome

Someone starting a small business here needs a plan, a realistic budget, a location, a brand and a way to track money. Today that means a consultant, a spreadsheet and a general-purpose chatbot that knows nothing about the business and invents its numbers. Incubators have the mirror problem: every startup plan arrives in a different shape and takes hours to compare.

| Section | What the user gets |
|---|---|
| Onboarding | Seven questions asked once; every agent reuses the answers, so nothing is typed twice |
| Studio | From one sentence: business plan, 12-month forecast with break-even, three locations on a map, names, slogans, two logos and a banner |
| Analysis | An investment readiness score (0–100) for a saved plan, a form or a PDF, with SWOT, budget check, competitors and a source for every market figure |
| Dashboard | Income and expense tracking, charts, plan versus actual, and an assistant that records transactions from plain language and answers questions with exact numbers |
| Network | Five recommended entrepreneurs with a reason for each, plus realtime 1:1 chat |

The same Analysis report is what an incubator would read to compare startup plans by one set of criteria.

## What the AI does, and what it is not trusted with

The model writes and judges; code counts, looks things up and checks the model's output.

| Feature | The model | Code |
|---|---|---|
| Studio (`lib/ai/studio.ts`) | Asks up to 3 clarifying questions, writes the plan, cost items, revenue estimate, location picks, names, slogans | Totals, projection and break-even (`lib/finance/forecast.ts`); map coordinates from a fixed list (`lib/places.ts`) |
| Branding (`lib/ai/branding.ts`) | Generates 2 logos and a banner | Stores them; falls back to SVG placeholders when the image API fails |
| Analysis (`lib/ai/analysis.ts`) | Scores readiness and market fit, writes SWOT, budget check, competitors, recommendations | Picks market rows by sector, runs web search, numbers the sources, drops citations it did not provide, takes market values from the database row |
| Dashboard assistant (`app/api/assistant`) | Chooses a tool, explains the result, parses a transaction from a sentence | Every sum, percentage, comparison and what-if (`lib/finance/dashboard.ts`); a transaction is saved only after the user confirms it |
| Matching (`lib/ai/matching.ts`) | Ranks the best 5 of up to 12 candidates and writes one reason each | Pre-filters in SQL, checks returned ids, falls back to a rule-based order |

Every agent returns JSON validated with Zod and retries once with the validation error. Prompts are in `lib/ai/prompts.ts`.

## Quality testing

### Automated tests

```bash
npm test
```

21 tests in `tests/` cover the parts that must never be wrong: the finance functions behind every number the assistant quotes, forecast break-even, period parsing, coordinate checks, the non-AI matching order, date and money formatting, and the English dictionary (no empty text, no placeholder the source does not supply). `tests/ai-guards.test.ts` feeds the code deliberately wrong model output (a made-up period, broken tool arguments, a negative amount, citations to sources that were never provided) and checks that each is caught. None of the tests call an AI service. `npm run lint` and `npx tsc --noEmit` are clean.

There is no automated scoring of the AI's writing yet. Plan and analysis quality has only been checked by hand on the demo business.

### Failure modes and what happens

| What goes wrong | What the app does |
|---|---|
| The model returns JSON that does not match the schema | One retry with the validation error; a second failure shows a friendly error instead of a broken page |
| The model does arithmetic or guesses a total | It has no way to: totals come from tools, and the prompt forbids stating a number without a tool result |
| The model cites a source that does not exist | Citation ids not issued by the server are removed; a figure without a valid source is labelled "estimate" |
| The model invents coordinates, or a place outside Azerbaijan | A known place id overrides them; out-of-bounds coordinates fall back to the user's city centre |
| The model asks for a period it made up ("last week") | The tool returns an error naming the valid periods, and the model corrects itself |
| The model returns a profile id that was not in the candidate list | The id is ignored and the list is topped up from the rule-based order |
| The assistant misreads a transaction | Nothing is saved until the user confirms the card |
| Image API has no quota, web search has no key | SVG placeholders with a notice; competitors described by type instead of by name |
| A scanned PDF with no text layer | Rejected with a message asking for the form instead (no OCR) |

### Known limits

- The seeded `market_data` rows are demo placeholders (their source names start with "DEMO"). The analysis is only as good as these rows; replace them with real figures before trusting a score.
- Early in a month the KPIs compare a partial month with a full one and show large negative changes.
- Plans, analyses and categories saved in one language stay in that language after switching.
- Deleting a chat removes it for both people, and the other person sees it only after a reload.

### Compared with how this is done now

| | Consultant + spreadsheet | General chatbot | Growenta |
|---|---|---|---|
| Knows the business | After interviews | Only what is pasted each time | From onboarding and saved data |
| Numbers | Correct, slow | Often invented or miscalculated | Calculated in code |
| Market claims | Sourced, if the consultant is careful | Unsourced | Sourced or marked as an estimate |
| After the plan | Separate bookkeeping | Nothing | Dashboard measures actuals against the plan |

This comparison is by design, not a measured study: there has been no side-by-side trial with users yet.

## Feasibility

**Data it needs.** Per user: the seven onboarding answers, and transactions typed or dictated to the assistant. Shared: market figures per sector and region in `market_data`, which should come from stat.gov.az and the World Bank. A plan can also be uploaded as a text PDF up to 4 MB.

**Running costs.** Supabase and Vercel free tiers are enough for a pilot. The variable cost is model usage; sizes below are estimates from prompt lengths, not billing data.

| Action | Calls | Rough size |
|---|---|---|
| Studio plan | 1 short call for questions + 1 plan call | about 2k tokens in, 3k out |
| Branding | 3 image generations | optional; placeholders if switched off |
| Analysis | 1 call (+ 1 web search) | up to about 6k tokens in, 2k out |
| Assistant message | 1–3 calls on `gpt-4.1-mini` | about 1.5k tokens in each |
| Matching | 1 short call, cached in the browser for 6 hours | about 1.5k tokens in |

The assistant is the high-volume feature, so it runs on a cheaper model (`LLM_ASSISTANT_MODEL`); plan and analysis keep the stronger one (`LLM_MODEL`).

**Next step.** Load real market data for the four covered sectors, then pilot with a small group of entrepreneurs and one incubator, comparing the readiness score with their own assessment of the same plans.

## What is different

- Onboarding context is shared by every agent, so the product behaves like one advisor rather than five tools.
- Arithmetic is never delegated to the model, and every market figure is either sourced or labelled.
- The plan does not end as a document: the dashboard tracks real income against the forecast the Studio produced.
- Local by default: Azerbaijani and English, AZN, Baku districts and regional cities with fixed coordinates.
- One report serves both sides, the entrepreneur and the incubator assessing them.

## Setup

**Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, Recharts, Leaflet, Supabase (Auth, Postgres, Realtime, Storage), OpenAI for the agents and images, Tavily for web search.

1. `npm install`
2. Create a project at https://supabase.com/dashboard and copy the URL, the `anon` key and the `service_role` key from **Project Settings → API**.
3. Copy `.env.example` to `.env.local` and fill it in.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase project and public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only admin key (sign-up, image and PDF storage). Never expose it to the client |
| `OPENAI_API_KEY`, `LLM_MODEL` | Yes | Model for the Studio, Analysis and Matching agents |
| `LLM_ASSISTANT_MODEL` | No | Model for the dashboard assistant (default `gpt-4.1-mini`) |
| `IMAGE_PROVIDER`, `IMAGE_MODEL`, `IMAGE_API_KEY` | No | Logo and banner generation (`openai` by default, or `gemini`). Without a working key the app shows SVG placeholders |
| `SEARCH_PROVIDER`, `SEARCH_API_KEY` | No | Web search for competitors (`tavily`) |

4. In the Supabase **SQL Editor** run, in order: `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_messages_delete.sql`, then `supabase/seed.sql` (demo users, market data, the "Nur Cosmetics" business with six months of transactions). All are safe to re-run.
5. `npm run dev` and open http://localhost:3000.

Demo login: the "Sign in with the demo account" button, or `demo@launchlens.az` / `demo12345`. If it fails after seeding, run `npm run seed:demo`.

**Deploying to Vercel:** import the repository, add every variable from `.env.local` under **Settings → Environment Variables**, and pick the function region closest to the Supabase project.

## Architecture

```
app/
  (auth)/login, register     Email/password auth + demo login
  api/                       studio, branding, analysis, assistant, matching, auth/register
  onboarding/                7-step questionnaire, saved to profiles
  (app)/                     Signed-in shell: top navigation + chat widget
    studio, analysis, dashboard, network, profile/[id]
components/                  ui primitives and one folder per section; i18n/ holds the language switch
lib/
  ai/                        prompts, Zod schemas, agents, image generation, web search
  finance/                   forecast and dashboard arithmetic
  i18n/                      language config, translator, English dictionary (en.ts)
  supabase/                  browser, server, admin and middleware clients
  places.ts, network.ts      fixed map coordinates; candidate filtering and fallback reasons
tests/                       unit tests (npm test)
supabase/                    SQL migrations and seed
```

- **Access:** the middleware sends signed-out users to `/login`. Row Level Security limits every table to its owner; profiles are readable by signed-in users and messages by their two participants.
- **Languages:** the Azerbaijani text in the code is the key, and `lib/i18n/en.ts` holds the English. The choice is stored in a `lang` cookie, so pages, API errors and agents agree.
- **Chat:** the widget reads and writes `messages` from the browser under RLS and receives new ones through Supabase Realtime.
