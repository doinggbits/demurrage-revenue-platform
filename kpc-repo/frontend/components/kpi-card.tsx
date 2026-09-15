import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  tone?:
    | "neutral"
    | "warning"
    | "danger"
    | "success"
    | "cyan"
    | "punched-red"
    | "punched-purple"
    | "punched-blue"
    | "punched-cyan"
    | "punched-lime"
    | "punched-dark";
}

const TONE_STYLES = {
  neutral: {
    card: "bg-white border border-kpc-border shadow-sm hover:shadow-md",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    val: "text-kpc-text",
    label: "text-kpc-text-3",
    sub: "text-kpc-text-3",
  },
  warning: {
    card: "bg-white border border-amber-200 shadow-sm hover:shadow-md",
    badge: "bg-amber-50 text-amber-600 border-amber-200",
    val: "text-amber-600",
    label: "text-kpc-text-3",
    sub: "text-kpc-text-3",
  },
  danger: {
    card: "bg-white border border-rose-200 shadow-sm hover:shadow-md",
    badge: "bg-rose-50 text-rose-600 border-rose-200",
    val: "text-rose-600",
    label: "text-kpc-text-3",
    sub: "text-kpc-text-3",
  },
  success: {
    card: "bg-white border border-emerald-200 shadow-sm hover:shadow-md",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
    val: "text-emerald-600",
    label: "text-kpc-text-3",
    sub: "text-kpc-text-3",
  },
  cyan: {
    card: "bg-white border border-sky-200 shadow-sm hover:shadow-md",
    badge: "bg-sky-50 text-sky-600 border-sky-200",
    val: "text-sky-600",
    label: "text-kpc-text-3",
    sub: "text-kpc-text-3",
  },
  "punched-red": {
    card: "bg-gradient-to-br from-[#E30613] via-[#F43F5E] to-[#FB7185] text-white shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-1 border-0",
    badge: "bg-white/20 text-white border-white/20",
    val: "text-white",
    label: "text-white/90",
    sub: "text-white/80",
  },
  "punched-purple": {
    card: "bg-gradient-to-br from-[#7C3AED] via-[#A855F7] to-[#C084FC] text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 border-0",
    badge: "bg-white/20 text-white border-white/20",
    val: "text-white",
    label: "text-white/90",
    sub: "text-white/80",
  },
  "punched-blue": {
    card: "bg-gradient-to-br from-[#1D4ED8] via-[#3B82F6] to-[#60A5FA] text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 border-0",
    badge: "bg-white/20 text-white border-white/20",
    val: "text-white",
    label: "text-white/90",
    sub: "text-white/80",
  },
  "punched-cyan": {
    card: "bg-gradient-to-br from-[#0891B2] via-[#06B6D4] to-[#38BDF8] text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-1 border-0",
    badge: "bg-white/20 text-white border-white/20",
    val: "text-white",
    label: "text-white/90",
    sub: "text-white/80",
  },
  "punched-lime": {
    card: "bg-gradient-to-br from-[#4D7C0F] via-[#65A30D] to-[#84CC16] text-white shadow-lg shadow-lime-500/25 hover:shadow-xl hover:shadow-lime-500/30 hover:-translate-y-1 border-0",
    badge: "bg-white/20 text-white border-white/20",
    val: "text-white",
    label: "text-white/90",
    sub: "text-white/80",
  },
  "punched-dark": {
    card: "bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] text-white shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-1 border-0",
    badge: "bg-white/10 text-white border-white/15",
    val: "text-white",
    label: "text-slate-300",
    sub: "text-slate-400",
  },
};

export function KpiCard({ label, value, subValue, icon: Icon, tone = "neutral" }: KpiCardProps) {
  const styles = TONE_STYLES[tone];
  const isPunched = tone.startsWith("punched-");

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300 ${styles.card}`}
    >
      {isPunched && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_55%)]" />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${styles.label}`}>{label}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110 ${styles.badge}`}
        >
          <Icon size={16} />
        </span>
      </div>

      <div className="relative mt-3">
        <p className={`text-2xl sm:text-[1.75rem] font-extrabold tracking-tight leading-none ${styles.val}`}>
          {value}
        </p>
        {subValue && (
          <p className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${styles.sub}`}>{subValue}</p>
        )}
      </div>
    </div>
  );
}
