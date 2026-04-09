"use client";

import { useState } from "react";
import { SectionCard } from "@/components/SectionCard";
import { type CallScript } from "@/lib/schema";

type CallScriptCardProps = {
  script: CallScript;
};

export function CallScriptCard({ script }: CallScriptCardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "keyQuestions" | "missingInfo" | "recommendations"
  >("overview");

  return (
    <SectionCard title="Personalized Onboarding Call Script">
      <details open>
        <summary className="cursor-pointer font-medium text-slate-700">
          View Script Sections
        </summary>

        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("keyQuestions")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                activeTab === "keyQuestions"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Key Questions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("missingInfo")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                activeTab === "missingInfo"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Missing Info Questions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("recommendations")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                activeTab === "recommendations"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Recommendations
            </button>
          </div>

          {activeTab === "overview" ? (
            <div className="space-y-3">
              <p dir="auto">
                <span className="font-medium">Opening: </span>
                {script.opening}
              </p>
              <p dir="auto">
                <span className="font-medium">Business Understanding: </span>
                {script.business_understanding}
              </p>
              <p dir="auto">
                <span className="font-medium">Closing: </span>
                {script.closing}
              </p>
            </div>
          ) : null}

          {activeTab === "keyQuestions" ? (
            <ul className="list-disc space-y-1 pl-5">
              {script.key_questions.map((question, idx) => (
                <li key={`${question}-${idx}`} dir="auto">
                  {question}
                </li>
              ))}
            </ul>
          ) : null}

          {activeTab === "missingInfo" ? (
            <ul className="list-disc space-y-1 pl-5">
              {script.missing_information_questions.map((question, idx) => (
                <li key={`${question}-${idx}`} dir="auto">
                  {question}
                </li>
              ))}
            </ul>
          ) : null}

          {activeTab === "recommendations" ? (
            <ul className="list-disc space-y-1 pl-5">
              {script.recommendations.map((recommendation, idx) => (
                <li key={`${recommendation}-${idx}`} dir="auto">
                  {recommendation}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex justify-end border-t border-slate-200 pt-3">
            <button
              type="button"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              Send to Client
            </button>
          </div>
        </div>
      </details>
    </SectionCard>
  );
}
