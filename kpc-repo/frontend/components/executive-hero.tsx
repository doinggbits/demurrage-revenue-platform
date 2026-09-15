import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ExecutiveHeroProps {
  badgeText?: string;
  badgeType?: "live" | "ai" | "alert" | "info";
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function ExecutiveHero({
  badgeText = "LIVE TELEMETRY ACTIVE",
  badgeType = "live",
  title,
  subtitle,
  imageSrc,
  imageAlt = "Kenya Pipeline Operations",
  breadcrumbs,
  actions,
  children,
}: ExecutiveHeroProps) {
  const badgeColors = {
    live: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ai: "border-sky-200 bg-sky-50 text-sky-700",
    alert: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-amber-200 bg-amber-50 text-amber-700",
  }[badgeType];

  return (
    <div className="mb-6 space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-kpc-text-3">
          {breadcrumbs.map((b, idx) => (
            <span key={idx} className="flex items-center gap-2">
              {b.href ? (
                <Link href={b.href} className="transition-colors hover:text-kpc-red">
                  {b.label}
                </Link>
              ) : (
                <span className="text-kpc-text font-semibold">{b.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && <ChevronRight size={13} className="text-kpc-text-4" />}
            </span>
          ))}
        </div>
      )}

      {/* Clean spacious page header + optional photo strip */}
      <div className="overflow-hidden rounded-2xl border border-kpc-border bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-5">
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:col-span-3">
            <div className="flex flex-wrap items-center gap-3">
              {badgeText && (
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${badgeColors}`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                  </span>
                  {badgeText}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-kpc-text sm:text-3xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-kpc-text-3">{subtitle}</p>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3 pt-1">{actions}</div>}
            {children}
          </div>
          <div className="relative hidden min-h-[160px] lg:col-span-2 lg:block">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="40vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
