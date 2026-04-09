"use client";

import { useState } from "react";

type UrlFormProps = {
  onAnalyze: (url: string) => Promise<void>;
  isLoading: boolean;
};

export function UrlForm({ onAnalyze, isLoading }: UrlFormProps) {
  const [url, setUrl] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await onAnalyze(url);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
      <label htmlFor="website-url" className="mb-2 block text-sm font-medium text-slate-700">
        Business website URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          id="website-url"
          type="url"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none ring-slate-300 placeholder:text-slate-400 focus:ring"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Analyzing..." : "Analyze Website"}
        </button>
      </div>
    </form>
  );
}
