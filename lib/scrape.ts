import * as cheerio from "cheerio";
import { extractVisibleText } from "@/lib/extractText";
import { cleanList } from "@/lib/utils";

const PRIORITY_KEYWORDS = [
  "about",
  "services",
  "contact",
  "pricing",
  "solutions",
  "products"
];

export type ScrapedPage = {
  url: string;
  title: string;
  text: string;
};

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ClientOnboardingExtractor/1.0; +https://example.local)"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  return response.text();
}

function getInternalLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const links: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

    try {
      const absolute = new URL(href, base).toString();
      const parsed = new URL(absolute);

      if (parsed.origin === base.origin) {
        links.push(parsed.toString());
      }
    } catch {
      // ignore invalid links
    }
  });

  return cleanList(links);
}

function rankLinks(links: string[]): string[] {
  const scored = links.map((link) => {
    const lower = link.toLowerCase();
    const score = PRIORITY_KEYWORDS.reduce(
      (acc, keyword) => (lower.includes(keyword) ? acc + 1 : acc),
      0
    );
    return { link, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((item) => item.link);
}

async function scrapeSinglePage(url: string): Promise<ScrapedPage> {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || url;
  const text = extractVisibleText(html);
  return { url, title, text };
}

export async function scrapeWebsite(
  startUrl: string,
  maxPages = 5
): Promise<ScrapedPage[]> {
  const homepageHtml = await fetchHtml(startUrl);
  const homepageText = extractVisibleText(homepageHtml);
  const homepageTitle = cheerio.load(homepageHtml)("title").first().text().trim();

  const internalLinks = getInternalLinks(homepageHtml, startUrl);
  const rankedLinks = rankLinks(internalLinks).slice(0, Math.max(0, maxPages - 1));
  const pagesToFetch = [startUrl, ...rankedLinks];

  const results = await Promise.allSettled(
    pagesToFetch.map(async (url, index) => {
      if (index === 0) {
        return {
          url,
          title: homepageTitle || startUrl,
          text: homepageText
        };
      }
      return scrapeSinglePage(url);
    })
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<ScrapedPage> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value)
    .slice(0, maxPages);
}

export function buildCorpus(pages: ScrapedPage[]): string {
  return pages
    .map(
      (page, index) =>
        `Page ${index + 1}\nURL: ${page.url}\nTitle: ${page.title}\nContent:\n${page.text}`
    )
    .join("\n\n---\n\n")
    .slice(0, 30000);
}
