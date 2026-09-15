const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; ping?: boolean }> = {
  IN_TRANSIT: { bg: "bg-sky-50 border-sky-200", text: "text-sky-700", dot: "bg-sky-500" },
  IN_QUEUE: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500", ping: true },
  LOADING: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  COMPLETED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  VIOLATED: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700 font-semibold", dot: "bg-rose-500", ping: true },
  PASSED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  REVIEW_REQUIRED: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500", ping: true },
  REJECTED: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  DRAFT: { bg: "bg-slate-50 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
  PENDING_APPROVAL: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500", ping: true },
  APPROVED: { bg: "bg-sky-50 border-sky-200", text: "text-sky-700", dot: "bg-sky-500" },
  ISSUED: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  SYNCED_TO_ERP: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  PAID: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  DISPUTED: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500", ping: true },
  CANCELLED: { bg: "bg-slate-50 border-slate-200", text: "text-slate-500", dot: "bg-slate-400" },
  ACTIVE: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  PENDING: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  EXPIRED: { bg: "bg-slate-50 border-slate-200", text: "text-slate-500", dot: "bg-slate-400" },
  TERMINATED: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  OPEN: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500", ping: true },
  RESOLVED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  RECOVERED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-xs text-kpc-text-4">—</span>;
  const cfg = STATUS_STYLES[status] ?? {
    bg: "bg-slate-50 border-slate-200",
    text: "text-slate-600",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide ${cfg.bg} ${cfg.text}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {cfg.ping && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${cfg.dot}`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      </span>
      {status.replaceAll("_", " ")}
    </span>
  );
}
