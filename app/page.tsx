"use client";

import { useState } from "react";
import { CallScriptCard } from "@/components/CallScriptCard";
import { ClientCard } from "@/components/ClientCard";
import { UrlForm } from "@/components/UrlForm";
import { type CallScript, type ClientProfile } from "@/lib/schema";

type AnalyzeResponse = {
  profile: ClientProfile;
  pagesScanned: Array<{ url: string; title: string }>;
  input: { url: string };
};

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [callScript, setCallScript] = useState<CallScript | null>(null);

  async function generateCallScript(profile: ClientProfile) {
    setIsScriptLoading(true);
    setScriptError(null);
    setCallScript(null);

    try {
      const response = await fetch("/api/call-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to generate onboarding call script.");
      }

      setCallScript(data.script as CallScript);
    } catch (err) {
      setScriptError(
        err instanceof Error ? err.message : "Unexpected call script generation error."
      );
    } finally {
      setIsScriptLoading(false);
    }
  }

  async function handleAnalyze(url: string) {
    setIsLoading(true);
    setError(null);
    setScriptError(null);
    setCallScript(null);

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

      const analyzeResult = data as AnalyzeResponse;
      setResult(analyzeResult);
      await generateCallScript(analyzeResult.profile);
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
        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
          Convert raw website content into a structured client onboarding profile.
          This tool helps internal teams quickly understand the business, identify
          onboarding gaps, and take concrete next steps toward go-live.
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
          <div className="space-y-4">
            <ClientCard profile={result.profile} pagesScanned={result.pagesScanned} />

            {isScriptLoading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                Generating personalized onboarding call script...
              </div>
            ) : null}

            {scriptError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {scriptError}
              </div>
            ) : null}

            {callScript ? <CallScriptCard script={callScript} /> : null}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            Submit a URL to generate a structured onboarding profile, not just a
            raw scrape.
          </div>
        )}
      </div>
    </main>
  );
}
