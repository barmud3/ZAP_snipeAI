type SectionCardProps = {
  title: string;
  children: React.ReactNode;
  tone?: "primary" | "default" | "muted";
};

export function SectionCard({ title, children, tone = "default" }: SectionCardProps) {
  const toneClass =
    tone === "primary"
      ? "border-slate-300 bg-white shadow-md"
      : tone === "muted"
        ? "border-slate-200 bg-slate-50 shadow-sm"
        : "border-slate-200 bg-white shadow-sm";

  return (
    <section className={`rounded-xl border p-5 ${toneClass}`}>
      <h3 className="mb-3 text-base font-semibold tracking-wide text-slate-700">
        {title}
      </h3>
      <div className="space-y-2 text-sm text-slate-800">{children}</div>
    </section>
  );
}
