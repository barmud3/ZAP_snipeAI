"use client";

import { useState } from "react";
import { ClientCard } from "@/components/ClientCard";
import { UrlForm } from "@/components/UrlForm";
import { type ClientProfile } from "@/lib/schema";

type AnalyzeResponse = {
  profile: ClientProfile;
  pagesScanned: Array<{ url: string; title: string }>;
  input: { url: string };
};

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  async function handleAnalyze(url: string) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to analyze website.");
      }

      setResult(data as AnalyzeResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Client Onboarding Extractor
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
          Analyze a business website and generate a structured client profile to
          kick off onboarding. The prototype scans up to 5 pages and proposes
          onboarding actions from missing information.
        </p>
      </div>

      <div className="space-y-6">
        <UrlForm onAnalyze={handleAnalyze} isLoading={isLoading} />

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <ClientCard profile={result.profile} pagesScanned={result.pagesScanned} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            Submit a URL to generate a client card.
          </div>
        )}
      </div>
    </main>
  );
}
