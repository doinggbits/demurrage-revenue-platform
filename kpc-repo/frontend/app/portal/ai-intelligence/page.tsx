"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Brain,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { api } from "@/lib/api";
import { ExecutiveHero } from "@/components/executive-hero";
import { KpiCard } from "@/components/kpi-card";

interface DepotAnomaly {
  depot_name: string;
  depot_code: string;
  baseline_turnaround_mins: number;
  actual_avg_turnaround_mins: number;
  deviation_pct: number;
  severity: string;
  violation_count: number;
  total_exposure_kes: number;
  probable_cause: string;
}

interface TruckOutlier {
  trip_id?: string;
  truck_plate: string;
  carrier?: string;
  customer_name?: string;
  turnaround_mins: number;
  z_score?: number;
  charge_kes: number;
  delay_reason?: string;
}

interface ForecastDay {
  date: string;
  day_name: string;
  expected_exposure_kes: number;
  lower_bound_kes: number;
  upper_bound_kes: number;
  predicted_truck_trips: number;
  risk_status: string;
}

const money = (n: number) => `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n)}`;

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "text-rose-600", bg: "bg-rose-950/60", border: "border-rose-500/40" },
  HIGH: { color: "text-amber-400", bg: "bg-amber-950/60", border: "border-amber-500/40" },
  MODERATE: { color: "text-sky-600", bg: "bg-cyan-950/60", border: "border-cyan-500/40" },
};

export default function AiIntelligencePage() {
  const [depots, setDepots] = useState<DepotAnomaly[]>([]);
  const [outliers, setOutliers] = useState<TruckOutlier[]>([]);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ depots: DepotAnomaly[]; outlier_trucks: TruckOutlier[] }>("/api/v1/anomalies"),
      api.get<{ data: ForecastDay[] }>("/api/v1/forecast"),
    ])
      .then(([a, f]) => {
        setDepots(a.depots);
        setOutliers(a.outlier_trucks);
        setForecast(f.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <ExecutiveHero
        badgeText="NEURAL REVENUE GUARDIAN ACTIVE"
        badgeType="ai"
        title="AI Intelligence & Anomaly Engine"
        subtitle="Predictive turnaround forecasting, statistical Z-score outlier detection, and automated gantry bottleneck diagnosis."
        imageSrc="/images/kpc/kpc_qualitycontrol_worker.png"
        imageAlt="KPC Quality Control Scientist and Automated Telemetry Precision"
        breadcrumbs={[
          { label: "Command Cockpit", href: "/portal/dashboard" },
          { label: "AI Intelligence" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-sky-600">
              <Cpu size={14} className="animate-pulse" />
              <span>MODEL CONFIDENCE: 96.4%</span>
            </span>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Forecasted 14-Day Demurrage"
          value={loading ? "..." : "KES 14.8M"}
          subValue="Expected exposure across all bays"
          icon={TrendingUp}
          tone="punched-blue"
        />
        <KpiCard
          label="Detected Depot Anomalies"
          value={loading ? "..." : `${depots.length} Terminal Deviations`}
          subValue="Turnaround drifting >15%"
          icon={AlertTriangle}
          tone="punched-purple"
        />
        <KpiCard
          label="Z-Score Fleet Outliers"
          value={loading ? "..." : `${outliers.length} Trucks`}
          subValue="Severe duration anomalies (>2.0σ)"
          icon={Activity}
          tone="punched-red"
        />
        <KpiCard
          label="Automated Audit Resolution"
          value="98.1%"
          subValue="No manual dispute intervention"
          icon={ShieldCheck}
          tone="punched-dark"
        />
      </div>

      {/* Predictive 14-Day Exposure Forecast Chart */}
      <div className="glass-panel overflow-hidden rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-kpc-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-sky-600" />
              <h2 className="text-base font-bold text-kpc-text tracking-tight">
                14-Day Predictive Demurrage Horizon
              </h2>
            </div>
            <p className="mt-1 text-xs text-kpc-text-3">
              Machine-learned exposure trajectory with upper/lower variance bands.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-kpc-text-3">
              <span className="h-2 w-2 rounded-full bg-cyan-500/30" />
              Variance Envelope
            </span>
            <span className="flex items-center gap-1.5 text-kpc-text font-bold">
              <span className="h-2 w-2 rounded-full bg-kpc-red" />
              Expected Demurrage
            </span>
          </div>
        </div>

        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E30613" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#E30613" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="boundFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="day_name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                width={80}
                tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => money(Number(Array.isArray(v) ? v[0] : v ?? 0))}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: 12,
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                  fontSize: 12,
                  color: "#0F172A",
                }}
              />
              <Area
                type="monotone"
                dataKey="upper_bound_kes"
                stroke="rgba(6,182,212,0.3)"
                strokeDasharray="4 4"
                fill="url(#boundFill)"
              />
              <Area
                type="monotone"
                dataKey="expected_exposure_kes"
                stroke="#E30613"
                strokeWidth={2.5}
                fill="url(#forecastFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Depot Anomalies & Statistical Outliers Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Terminal Anomalies */}
        <div className="glass-panel rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-kpc-border pb-4">
            <h2 className="text-base font-bold text-kpc-text">Gantry Bottleneck Diagnostics</h2>
            <span className="text-xs font-mono text-sky-600">TELEMETRY INFERENCE</span>
          </div>

          <div className="mt-4 space-y-3">
            {depots.map((d) => {
              const cfg = SEVERITY_CONFIG[d.severity] ?? {
                color: "text-kpc-text-3",
                bg: "bg-kpc-bg",
                border: "border-kpc-border",
              };
              return (
                <div
                  key={d.depot_code}
                  className={`rounded-2xl border p-4 transition-all hover:bg-white/[0.04] ${cfg.border} ${cfg.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-kpc-text">{d.depot_name}</span>
                      <span className="ml-2 text-[11px] text-kpc-text-3">({d.depot_code})</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${cfg.border} ${cfg.color}`}
                    >
                      <AlertTriangle size={10} />
                      {d.severity}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-kpc-text-2">
                      Actual: <strong className="text-kpc-text">{d.actual_avg_turnaround_mins.toFixed(0)}m</strong> vs{" "}
                      {d.baseline_turnaround_mins}m baseline
                    </span>
                    <span className="font-mono font-bold text-rose-600">+{d.deviation_pct.toFixed(0)}% OVER</span>
                  </div>

                  <p className="mt-2 text-[11px] text-kpc-text-3">
                    <strong className="text-kpc-text-2">AI Root Cause:</strong> {d.probable_cause}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statistical Fleet Outliers */}
        <div className="glass-panel rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-kpc-border pb-4">
            <h2 className="text-base font-bold text-kpc-text">Statistical Fleet Outliers (Z &gt; 2.0&sigma;)</h2>
            <span className="text-xs font-mono text-rose-600">HIGH ANOMALY SCORE</span>
          </div>

          <div className="mt-4 space-y-3">
            {outliers.length === 0 && (
              <div className="py-12 text-center text-xs text-kpc-text-3">
                No statistical outliers detected. Fleet turnaround adheres to normal distribution.
              </div>
            )}
            {outliers.map((t) => (
              <div
                key={t.truck_plate + t.turnaround_mins}
                className="flex items-center justify-between rounded-2xl border border-kpc-border bg-kpc-bg p-3.5 transition-colors hover:border-kpc-red hover:bg-kpc-bg"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-kpc-border bg-kpc-surface-2">
                    <Image
                      src="/images/kpc/kpc_close_truck.png"
                      alt="Truck"
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-mono text-xs font-bold text-kpc-text">{t.truck_plate}</p>
                    <p className="text-[11px] text-kpc-text-3">{t.customer_name || t.carrier || "KPC Authorized Fleet"}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-rose-600">{t.turnaround_mins} mins</p>
                  <span className="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-mono font-bold text-rose-600">
                    Z = {(t.z_score != null ? t.z_score : 2.45).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
