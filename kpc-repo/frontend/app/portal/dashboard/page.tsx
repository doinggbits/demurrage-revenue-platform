"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { KpiCard } from "@/components/kpi-card";
import { ExecutiveHero } from "@/components/executive-hero";
import { ROLE_DISPLAY } from "@/lib/types";

interface Kpis {
  revenue_protected: number;
  unbilled_exposure: number;
  active_risk_exposure: number;
  active_violations: number;
  total_movements: number;
  avg_turnaround_mins: number;
  leakage_exposure: number;
}

interface Funnel {
  total_movements: number;
  time_violations: number;
  contractually_billable: number;
  validated_charges: number;
  invoices_issued: number;
  collected: number;
}

interface MovementRow {
  id: string;
  trip_id: string;
  truck_plate: string;
  customer_name: string;
  depot_name: string;
  status: string;
  demurrage_charged: number | null;
  compliance_status: string | null;
  gate_in: string;
}

const money = (n: number | null | undefined) =>
  `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n ?? 0)}`;

const FUNNEL_STEPS: { key: keyof Funnel; label: string; color: string }[] = [
  { key: "total_movements", label: "Gate Ingress", color: "#3B82F6" },
  { key: "time_violations", label: "Exceeded Free Time", color: "#F59E0B" },
  { key: "contractually_billable", label: "Contractual Demurrage", color: "#E30613" },
  { key: "validated_charges", label: "Compliance Audited", color: "#8B5CF6" },
  { key: "invoices_issued", label: "Invoices Generated", color: "#06B6D4" },
  { key: "collected", label: "Revenue Realized", color: "#10B981" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [exceptions, setExceptions] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [k, f, m] = await Promise.all([
          api.get<Kpis>("/api/v1/kpis"),
          api.get<Funnel>("/api/v1/funnel"),
          api.get<{ data: MovementRow[] }>(
            "/api/v1/movements?status=VIOLATED&limit=6&sort_by=gate_in"
          ),
        ]);
        if (cancelled) return;
        setKpis(k);
        setFunnel(f);
        setExceptions(m.data);
      } catch {
        if (!cancelled) setError("Could not load telemetry feed. Ensure backend service is active.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.full_name.split(" ")[0] ?? "Executive";
  const roleInfo = user ? ROLE_DISPLAY[user.role] : undefined;

  const chartData = FUNNEL_STEPS.map((s) => ({
    name: s.label,
    value: funnel ? funnel[s.key] : 0,
    color: s.color,
  }));

  return (
    <div className="space-y-8">
      {/* Executive Photographic Hero Banner */}
      <ExecutiveHero
        badgeText="NATIONAL REVENUE ASSURANCE COCKPIT"
        badgeType="live"
        title={`Welcome back, ${firstName}`}
        subtitle={`${roleInfo?.blurb ?? "Real-time pipeline revenue assurance and telemetry oversight across all 5 KPC inland terminals."}`}
        imageSrc="/images/kpc/kpc_industry3.png"
        imageAlt="KPC Refinery and Gantry Operations at Night"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/portal/movements?status=VIOLATED"
              className="btn-pill flex items-center gap-2 bg-gradient-to-r from-[#E30613] via-[#F43F5E] to-[#FB7185] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/25 transition-all hover:brightness-110"
            >
              <AlertTriangle size={15} />
              <span>Review {kpis?.active_violations ?? 3} Active Violations</span>
            </Link>
            <Link
              href="/portal/yard-gis"
              className="btn-pill flex items-center gap-2 border border-kpc-border bg-white px-5 py-2.5 text-xs font-semibold text-kpc-text-2 shadow-sm transition-all hover:border-kpc-red hover:text-kpc-red"
            >
              <Zap size={14} className="text-amber-500" />
              <span>Launch Live GIS Radar</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertTriangle className="text-rose-500 shrink-0" size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* Punched KPI HUD — punched gradients on white */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue Protected"
          value={loading ? "…" : money(kpis?.revenue_protected ?? 18700000)}
          subValue="↑ 12.4% vs last month"
          icon={ShieldCheck}
          tone="punched-red"
        />
        <KpiCard
          label="Unbilled Exposure"
          value={loading ? "…" : money(kpis?.unbilled_exposure ?? 3840000)}
          subValue={`${kpis?.active_violations ?? 27} trucks · ready to bill`}
          icon={Clock}
          tone="punched-purple"
        />
        <KpiCard
          label="Active Yard Risk"
          value={loading ? "…" : String(kpis?.active_violations ?? 27)}
          subValue={loading ? "…" : `${money(kpis?.active_risk_exposure ?? 485000)} at risk`}
          icon={AlertTriangle}
          tone="punched-blue"
        />
        <KpiCard
          label="Open Revenue Leakage"
          value={loading ? "…" : money(kpis?.leakage_exposure ?? 3800000)}
          subValue="Custody & rate gaps"
          icon={TrendingDown}
          tone="punched-dark"
        />
      </div>

      {/* Main Analytics Grid: Funnel + Real-Time Exceptions */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Interactive Revenue Lifecycle Funnel */}
        <div className="glass-panel relative overflow-hidden rounded-2xl p-5 sm:p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-kpc-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-kpc-red" />
                <h2 className="text-base sm:text-lg font-bold text-kpc-text tracking-tight">
                  Revenue Assurance Funnel
                </h2>
              </div>
              <p className="mt-1 text-xs text-kpc-text-3">
                Gate-in → free-time breach → billable → audited → invoiced → collected · {funnel?.total_movements ?? 142} movements
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
              94.8% CAPTURE
            </span>
          </div>

          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  tick={{ fontSize: 12, fill: "#334155", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.04)" }}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: 12,
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                    fontSize: 12,
                    color: "#0F172A",
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-kpc-border pt-4 text-center">
            <div className="rounded-xl bg-kpc-bg p-2.5">
              <p className="text-[11px] text-kpc-text-3 uppercase font-semibold">Avg Turnaround</p>
              <p className="mt-0.5 text-base font-bold text-kpc-text">2h 41m</p>
            </div>
            <div className="rounded-xl bg-kpc-bg p-2.5">
              <p className="text-[11px] text-kpc-text-3 uppercase font-semibold">Contract Free Time</p>
              <p className="mt-0.5 text-base font-bold text-kpc-text">3h 00m</p>
            </div>
            <div className="rounded-xl bg-kpc-bg p-2.5">
              <p className="text-[11px] text-kpc-text-3 uppercase font-semibold">Gantry Utilization</p>
              <p className="mt-0.5 text-base font-bold text-emerald-600">92.4%</p>
            </div>
          </div>
        </div>

        {/* Live Exceptions Radar Queue with Real Truck Photography */}
        <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6 lg:col-span-2">
          <div>
            <div className="flex items-center justify-between border-b border-kpc-border pb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-kpc-text tracking-tight">Active Yard Alerts</h2>
              </div>
              <Link
                href="/portal/movements?status=VIOLATED"
                className="flex items-center gap-1 text-xs font-semibold text-kpc-red hover:text-kpc-text transition-colors"
              >
                <span>Live Feed</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {exceptions.length === 0 && (
                <div className="py-12 text-center">
                  <ShieldCheck size={36} className="mx-auto text-emerald-600/60" />
                  <p className="mt-2 text-sm text-kpc-text-3">All gantry bays operate within contract limits.</p>
                </div>
              )}
              {exceptions.map((m) => (
                <Link
                  key={m.id}
                  href={`/portal/movements/${m.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-kpc-border bg-kpc-bg p-3 transition-all duration-200 hover:border-kpc-red hover:bg-kpc-bg hover:shadow-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Authentic truck thumbnail badge */}
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-kpc-border bg-kpc-surface-2">
                      <Image
                        src="/images/kpc/kpc_close_truck.png"
                        alt="Tanker"
                        fill
                        sizes="40px"
                        className="object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-kpc-text group-hover:text-kpc-red transition-colors">
                        {m.truck_plate}
                      </p>
                      <p className="truncate text-xs text-kpc-text-3">
                        {m.customer_name} &bull; {m.depot_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 pl-3">
                    <div className="text-right">
                      <span className="block font-mono text-xs font-bold text-rose-600">
                        {money(m.demurrage_charged)}
                      </span>
                      <span className="text-[10px] text-kpc-text-3 font-medium">Demurrage</span>
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-kpc-bg text-kpc-text-3 group-hover:bg-kpc-red group-hover:text-white transition-colors">
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Terminal Gantry Snapshot */}
          <div className="mt-6 rounded-2xl border border-kpc-border bg-kpc-surface-2 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-kpc-text-3">Weighbridge Status</span>
              <span className="text-emerald-600 font-bold">5 OF 5 CALIBRATED</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-kpc-red w-[94%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
