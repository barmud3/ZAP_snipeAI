import * as cheerio from "cheerio";

export function extractVisibleText(html: string): string {
  const $ = cheerio.load(html);

  $("script, style, noscript, svg, iframe, form, header, footer").remove();

  const text = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, 8000);
}
