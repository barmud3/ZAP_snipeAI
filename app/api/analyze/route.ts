import { NextRequest, NextResponse } from "next/server";
import { extractClientProfile } from "@/lib/anthropic";
import { analyzeRequestSchema } from "@/lib/schema";
import { buildCorpus, scrapeWebsite } from "@/lib/scrape";
import { normalizeUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedInput = analyzeRequestSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        { error: "Invalid request data.", details: parsedInput.error.flatten() },
        { status: 400 }
      );
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(parsedInput.data.url);
    } catch {
      return NextResponse.json(
        { error: "Please provide a valid website URL." },
        { status: 400 }
      );
    }

    const pages = await scrapeWebsite(normalizedUrl, 5);
    if (pages.length === 0) {
      return NextResponse.json(
        { error: "Could not scrape any pages from the provided website." },
        { status: 422 }
      );
    }

    const corpus = buildCorpus(pages);
    const profile = await extractClientProfile(corpus, normalizedUrl);

    return NextResponse.json({
      input: { url: normalizedUrl },
      pagesScanned: pages.map((page) => ({ url: page.url, title: page.title })),
      profile
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected analyze failure.";

    if (message.includes("Failed to fetch website homepage")) {
      return NextResponse.json(
        {
          error:
            "Unable to access that website for scraping (it may block automated requests). Try another URL or a publicly accessible page."
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
