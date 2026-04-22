export default function DashboardStubPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border bg-[var(--app-surface)] p-8 shadow-sm"
      style={{ borderColor: "var(--app-border)" }}
    >
      <h2 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">{description}</p>
      ) : (
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          This section is ready for your routes — connect API and content when you wire the backend.
        </p>
      )}
    </div>
  );
}
