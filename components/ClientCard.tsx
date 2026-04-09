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
    <div className="space-y-4">
      <SectionCard title="Business Overview">
        <p>
          <span className="font-medium">Business Name: </span>
          <Value value={profile.businessName} />
        </p>
        <p>
          <span className="font-medium">Description: </span>
          <Value value={profile.businessDescription} />
        </p>
        <p>
          <span className="font-medium">Industry: </span>
          <Value value={profile.industry} />
        </p>
        <p>
          <span className="font-medium">Location: </span>
          <Value value={profile.location} />
        </p>
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

      <SectionCard title="Main Services">
        <ListOrFallback
          items={profile.mainServices}
          fallback="No specific services detected."
        />
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

      <SectionCard title="Digital Assets">
        <p className="font-medium">Social Links</p>
        <ListOrFallback items={profile.socialLinks} fallback="No social links found." />
        <p className="pt-2 font-medium">Image URLs</p>
        <ListOrFallback items={profile.imageUrls} fallback="No image URLs found." />
      </SectionCard>

      <SectionCard title="Review Mentions">
        <ListOrFallback
          items={profile.reviewMentions}
          fallback="No public reviews or testimonials surfaced."
        />
      </SectionCard>

      <SectionCard title="Missing Information">
        <ListOrFallback
          items={profile.missingInformation}
          fallback="No major gaps flagged."
        />
      </SectionCard>

      <SectionCard title="Suggested Onboarding Actions">
        <ListOrFallback
          items={profile.suggestedOnboardingActions}
          fallback="No onboarding actions suggested."
        />
      </SectionCard>

      <SectionCard title="Pages Scanned">
        <ul className="list-disc space-y-1 pl-5">
          {pagesScanned.map((page) => (
            <li key={page.url} dir="auto">
              {page.title} - {page.url}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
