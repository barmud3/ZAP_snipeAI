import { type ClientProfile } from "@/lib/schema";
import { SectionCard } from "@/components/SectionCard";

type ClientCardProps = {
  profile: ClientProfile;
  pagesScanned: Array<{ url: string; title: string }>;
};

function hasHebrew(value: string): boolean {
  return /[\u0590-\u05FF]/.test(value);
}

function ListOrFallback({
  items,
  fallback
}: {
  items: string[];
  fallback: string;
}) {
  if (!items.length) {
    return <p className="text-slate-500">{fallback}</p>;
  }

  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item, idx) => (
        <li
          key={`${item}-${idx}`}
          dir={hasHebrew(item) ? "rtl" : "ltr"}
          className={hasHebrew(item) ? "text-right" : ""}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Value({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-slate-500">Unknown</span>;
  }

  const isHebrew = hasHebrew(value);

  return (
    <span dir={isHebrew ? "rtl" : "ltr"} className={isHebrew ? "inline-block text-right" : ""}>
      {value}
    </span>
  );
}

export function ClientCard({ profile, pagesScanned }: ClientCardProps) {
  return (
    <div className="space-y-6">
      <SectionCard title="Onboarding Summary" tone="primary">
        <p dir="auto" className="text-sm leading-6 text-slate-800">
          <Value value={profile.onboardingSummary} />
        </p>
      </SectionCard>

      <SectionCard title="Business Overview" tone="primary">
        <p>
          <span className="font-semibold">Business Name: </span>
          <Value value={profile.businessName} />
        </p>
        <p>
          <span className="font-semibold">Description: </span>
          <Value value={profile.businessDescription} />
        </p>
        <p>
          <span className="font-semibold">Industry: </span>
          <Value value={profile.industry} />
        </p>
        <p>
          <span className="font-semibold">Location: </span>
          <Value value={profile.location} />
        </p>
      </SectionCard>

      <SectionCard title="Main Services">
        <ListOrFallback
          items={profile.mainServices}
          fallback="No specific services detected."
        />
      </SectionCard>

      <SectionCard title="Contact Information">
        <p>
          <span className="font-medium">Website: </span>
          <Value value={profile.website} />
        </p>
        <p>
          <span className="font-medium">Email: </span>
          <Value value={profile.contactEmail} />
        </p>
        <p>
          <span className="font-medium">Phone: </span>
          <Value value={profile.contactPhone} />
        </p>
      </SectionCard>

      <SectionCard title="Audience and Brand Tone">
        <p>
          <span className="font-medium">Target Audience: </span>
          <Value value={profile.targetAudience} />
        </p>
        <p>
          <span className="font-medium">Brand Tone: </span>
          <Value value={profile.brandTone} />
        </p>
      </SectionCard>

      <SectionCard title="Review Mentions">
        <p>
          <span className="font-medium">Sentiment: </span>
          {profile.reviewInsights.sentimentSummary}
        </p>
        <p dir="auto">
          <span className="font-medium">Summary: </span>
          <Value value={profile.reviewInsights.summary} />
        </p>
        <p className="pt-1 font-medium">Example Mentions</p>
        <ListOrFallback items={profile.reviewInsights.examples} fallback="No concise review examples available." />
      </SectionCard>

      <SectionCard title="Digital Assets" tone="muted">
        <p className="font-medium">Social Links</p>
        <ListOrFallback items={profile.socialLinks} fallback="No social links found." />
        <p className="pt-2 font-medium">Image URLs</p>
        <ListOrFallback items={profile.imageUrls} fallback="No image URLs found." />
      </SectionCard>

      <SectionCard title="Technical Details" tone="muted">
        <details>
          <summary className="cursor-pointer font-medium text-slate-700">
            Pages Scanned ({pagesScanned.length})
          </summary>
          <ul className="list-disc space-y-1 pl-5 pt-3">
            {pagesScanned.map((page, idx) => (
              <li key={`${page.url}-${idx}`} dir="auto">
                {page.title} - {page.url}
              </li>
            ))}
          </ul>
        </details>
      </SectionCard>
    </div>
  );
}
