# Client Onboarding Extractor

A lightweight Next.js prototype that simulates an AI-powered onboarding assistant.

Users submit a business website URL, the system scrapes up to 5 relevant pages, and Anthropic turns that content into a structured **client card** that helps onboarding teams start with a reliable first profile.

## Why this is useful for onboarding

New client onboarding often starts with fragmented information and repetitive discovery calls.
This prototype reduces that initial friction by:

- pre-filling core business context from public website content
- surfacing missing information the team should request
- suggesting immediate next onboarding actions

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Anthropic API
- Cheerio for HTML parsing/scraping
- Zod for request and AI response validation

## What the prototype does

1. Accepts a business website URL.
2. Fetches the homepage HTML.
3. Extracts internal links from the same domain.
4. Prioritizes likely useful pages (`about`, `services`, `contact`, `pricing`, `solutions`, `products`).
5. Scrapes up to 5 pages total (homepage + selected links).
6. Cleans and combines text into one corpus.
7. Sends corpus to Anthropic with a structured extraction prompt.
8. Validates AI output against a Zod schema.
9. Renders a clean client card with onboarding-focused sections.

## Scraping approach

Scraping is intentionally simple and demo-friendly:

- server-side fetch of raw HTML (no headless browser)
- parse with Cheerio
- remove noisy elements (`script`, `style`, `noscript`, `svg`, `iframe`, `form`, `header`, `footer`)
- extract page title + visible body text
- collect only internal links from the same origin
- rank links using onboarding-relevant keywords

This keeps implementation readable and reliable enough for a prototype.

## AI extraction approach

The app sends combined page content to Anthropic and asks for a strict JSON object with:

- business details (name, description, industry, location)
- contact fields
- services and audience context
- brand tone, social links, image URLs, review mentions
- `missingInformation` and `suggestedOnboardingActions`

The prompt emphasizes:

- evidence-based extraction
- careful inference only when reasonable
- no hallucinated facts
- explicit unknowns

The JSON response is parsed and validated with Zod before returning to the UI.

## Architecture (short)

- `app/page.tsx`: main UX, form submission, loading/error/result states
- `app/api/analyze/route.ts`: URL validation, scraping orchestration, AI call, response validation
- `components/*`: reusable UI blocks for form and sectioned client card
- `lib/scrape.ts`: fetch + parse + internal link prioritization + corpus builder
- `lib/extractText.ts`: visible text extraction/cleanup
- `lib/anthropic.ts`: prompt + Anthropic request + Zod output parsing
- `lib/schema.ts`: shared Zod schemas/types

## Project structure

```text
app/
  api/analyze/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  ClientCard.tsx
  SectionCard.tsx
  UrlForm.tsx
lib/
  extractText.ts
  anthropic.ts
  schema.ts
  scrape.ts
  utils.ts
```

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Add environment variables:

```bash
cp .env.example .env.local
```

Set:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

3. Start the dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Limitations

- Static HTML scraping only (JS-heavy websites may return partial content)
- No crawl politeness controls (robots.txt handling, advanced rate limiting)
- Basic relevance scoring for links
- AI extraction quality depends on content quality and model behavior
- No persistence/database/authentication (prototype-only)

## Future improvements

- better page selection heuristics and deduplication
- richer content chunking and confidence scoring
- optional headless fallback for JS-rendered pages
- retry and timeout policies for scraping robustness
- export/share workflow for onboarding teams (PDF/CRM handoff)
