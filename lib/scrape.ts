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

type FetchResult = {
  html: string;
  finalUrl: string;
};

function buildCandidateUrls(url: string): string[] {
  const base = new URL(url);
  const candidates: string[] = [base.toString()];

  const toggledProtocol = new URL(base.toString());
  toggledProtocol.protocol = base.protocol === "https:" ? "http:" : "https:";
  candidates.push(toggledProtocol.toString());

  if (!base.hostname.startsWith("www.")) {
    const withWww = new URL(base.toString());
    withWww.hostname = `www.${base.hostname}`;
    candidates.push(withWww.toString());
  }

  return cleanList(candidates);
}

async function fetchHtml(url: string): Promise<FetchResult> {
  const candidates = buildCandidateUrls(url);
  const failedStatuses: string[] = [];

  for (const candidateUrl of candidates) {
    try {
      const response = await fetch(candidateUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9,he;q=0.8"
        },
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        failedStatuses.push(`${candidateUrl} (${response.status})`);
        continue;
      }

      return {
        html: await response.text(),
        finalUrl: response.url || candidateUrl
      };
    } catch {
      failedStatuses.push(`${candidateUrl} (network error)`);
    }
  }

  throw new Error(
    `Failed to fetch website homepage. Tried: ${failedStatuses.join(", ")}`
  );
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
  const { html, finalUrl } = await fetchHtml(url);
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || finalUrl;
  const text = extractVisibleText(html);
  return { url: finalUrl, title, text };
}

export async function scrapeWebsite(
  startUrl: string,
  maxPages = 5
): Promise<ScrapedPage[]> {
  const homepageFetch = await fetchHtml(startUrl);
  const homepageHtml = homepageFetch.html;
  const homepageUrl = homepageFetch.finalUrl;
  const homepageText = extractVisibleText(homepageHtml);
  const homepageTitle = cheerio.load(homepageHtml)("title").first().text().trim();

  const internalLinks = getInternalLinks(homepageHtml, homepageUrl);
  const rankedLinks = rankLinks(internalLinks).slice(0, Math.max(0, maxPages - 1));
  const pagesToFetch = [homepageUrl, ...rankedLinks];

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

  const fulfilledPages = results
    .filter(
      (result): result is PromiseFulfilledResult<ScrapedPage> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);

  const seenUrls = new Set<string>();
  const uniquePages: ScrapedPage[] = [];

  for (const page of fulfilledPages) {
    if (seenUrls.has(page.url)) continue;
    seenUrls.add(page.url);
    uniquePages.push(page);
    if (uniquePages.length >= maxPages) break;
  }

  return uniquePages;
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
