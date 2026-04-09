# Client Onboarding Extractor

Prototype for a hiring assignment: convert a business website into a structured internal onboarding profile.

## Live Demo

- [https://zap-snipe-ai.vercel.app/](https://zap-snipe-ai.vercel.app/)

## Demo Video

- [Watch demo on Vimeo](https://vimeo.com/1181573025)

## What it does

1. User enters a website URL.
2. Backend scrapes the homepage + up to 4 relevant internal pages.
3. AI extracts structured business data.
4. UI shows an onboarding-ready client profile + call script.

This is intentionally a clean, demo-focused internal tool (no auth, no DB).

## Technology choices and assignment fit

- **Next.js (App Router) + TypeScript**  
  This matches the required framework and keeps frontend + backend in one codebase. App Router is used for the page UI and API routes (`/api/analyze`, `/api/call-script`) so the full prototype flow is easy to demo and maintain.

- **Tailwind CSS**  
  This matches the required styling stack and supports fast iteration on clean internal-tool UX. It is used to create a clear hierarchy (summary first, structured cards, technical details at the bottom) without over-engineering.

- **Anthropic API (AI layer)**  
  AI is used in two practical steps required by the product goal:  
  1) transform scraped website text into structured onboarding data, and  
  2) generate a personalized onboarding call script from that profile.  
  This makes the prototype more than scraping; it turns content into onboarding-ready output.

- **Cheerio (scraping layer)**  
  This matches the required parsing library and keeps scraping lightweight. It extracts text/title/links from static HTML, keeps internal links only, and supports selecting up to 5 relevant pages (homepage + prioritized internal pages).

- **Zod (validation layer)**  
  This matches the required schema-validation library and is used to validate request input and AI outputs. It prevents malformed AI responses from breaking the UI and keeps API responses predictable for the demo.

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
