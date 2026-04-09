# Client Onboarding Extractor

Prototype for a hiring assignment: convert a business website into a structured internal onboarding profile.

## What it does

1. User enters a website URL.
2. Backend scrapes the homepage + up to 4 relevant internal pages.
3. AI extracts structured business data.
4. UI shows an onboarding-ready client profile + call script.

This is intentionally a clean, demo-focused internal tool (no auth, no DB).

## Tech and why it matches the requirements

- **Next.js (App Router) + TypeScript**  
  Required stack. Used for UI + API routes in one project.

- **Tailwind CSS**  
  Required stack. Used for fast, clean internal-tool styling and clear hierarchy.

- **Anthropic API**  
  Used for structured extraction and onboarding call script generation.

- **Cheerio**  
  Required scraping library. Parses HTML and extracts titles/text/links without a headless browser.

- **Zod**  
  Required validation library. Validates input and AI output schemas to keep responses predictable.

## Requirement mapping

- **URL input + Analyze flow**: `app/page.tsx`, `components/UrlForm.tsx`
- **POST analyze endpoint**: `app/api/analyze/route.ts`
- **Scrape up to 5 pages, prioritize relevant links**: `lib/scrape.ts`
- **Structured AI extraction**: `lib/anthropic.ts`
- **Schema validation**: `lib/schema.ts`
- **Client card UI sections**: `components/ClientCard.tsx`, `components/SectionCard.tsx`
- **Onboarding call script UI**: `components/CallScriptCard.tsx`

## Run locally

```bash
npm install
```

Create `.env.local` file:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Limitations (prototype scope)

- Static HTML scraping only (JS-heavy sites may be partial)
- Some websites block automated scraping (403)
- AI output quality depends on source content quality
- No persistence/authentication by design
