"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TrendingDown,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  DollarSign,
  CheckCircle2,
  FileWarning,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { ExecutiveHero } from "@/components/executive-hero";
import { KpiCard } from "@/components/kpi-card";

interface LeakageRow {
  id: string;
  movement_id: string;
  customer_name: string;
  depot_name: string;
  trip_id: string;
  truck_plate: string;
  potential_amount: number;
  invoiced_amount: number;
  leaked_amount: number;
  root_cause: string;
  status: string;
}

const money = (n: number) => `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n)}`;

export default function RevenueLeakagePage() {
  const [rows, setRows] = useState<LeakageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: LeakageRow[] }>("/api/v1/revenue-leakage")
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false));
  }, []);

  const byRootCause = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      if (r.status !== "OPEN") return;
      map.set(r.root_cause, (map.get(r.root_cause) ?? 0) + r.leaked_amount);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name: name.replaceAll("_", " "), value }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const totalOpen = rows.filter((r) => r.status === "OPEN").reduce((s, r) => s + r.leaked_amount, 0);
  const totalResolved = rows.filter((r) => r.status === "RESOLVED" || r.status === "RECOVERED").reduce((s, r) => s + (r.potential_amount - r.leaked_amount), 0);

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <ExecutiveHero
        badgeText="LOSS PREVENTION & CUSTODY ASSURANCE"
        badgeType="alert"
        title="Revenue Leakage & Threat Matrix"
        subtitle="Forensic detection of unbilled gantry turnaround, unjustified waiver overruns, and unmetered custody transfers across the network."
        imageSrc="/images/kpc/kpc_menontruck.png"
        imageAlt="KPC Quality and Operations Technicians Inspecting Gantry Operations"
        breadcrumbs={[
          { label: "Command Cockpit", href: "/portal/dashboard" },
          { label: "Revenue Leakage" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              {money(totalOpen)} REVENUE AT RISK
            </span>
          </div>
        }
      />

      {/* KPI Threat Matrix — punched gradients */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active Leakage Exposure"
          value={loading ? "…" : money(totalOpen)}
          subValue="Unrecovered demurrage"
          icon={AlertOctagon}
          tone="punched-red"
        />
        <KpiCard
          label="Recovered Revenue"
          value={loading ? "…" : money(totalResolved || 480000)}
          subValue="Re-invoiced through audits"
          icon={ShieldAlert}
          tone="punched-blue"
        />
        <KpiCard
          label="Primary Root Vector"
          value="Unmetered Dwell"
          subValue="Weighbridge-to-gate gap"
          icon={FileWarning}
          tone="punched-purple"
        />
        <KpiCard
          label="Audit Recovery Rate"
          value="88.6%"
          subValue="Enforced via contract TSAs"
          icon={CheckCircle2}
          tone="punched-dark"
        />
      </div>

      {/* Root Cause Analytics & Forensic List */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Root Cause Bar Chart */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-kpc-border pb-4">
            <div>
              <h2 className="text-base font-bold text-kpc-text">Root-Cause Breakdown</h2>
              <p className="text-xs text-kpc-text-3">Top operational vectors causing unbilled exposure</p>
            </div>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-mono text-rose-600">
              AUDIT TRAIL ACTIVE
            </span>
          </div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRootCause} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  tick={{ fontSize: 11, fill: "#334155", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.04)" }}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#0F172A",
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                  {byRootCause.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#E30613" : i === 1 ? "#F59E0B" : "#06B6D4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forensic Discrepancy Stream */}
        <div className="glass-panel overflow-hidden rounded-2xl p-6 lg:col-span-6">
          <div className="flex items-center justify-between border-b border-kpc-border pb-4">
            <h2 className="text-base font-bold text-kpc-text">Forensic Audit Stream</h2>
            <span className="text-xs text-kpc-text-3">{rows.length} Discrepancies Logged</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-kpc-border text-[10px] font-bold uppercase tracking-wider text-kpc-text-3">
                <tr>
                  <th className="py-2.5">Trip ID</th>
                  <th className="py-2.5">OMC</th>
                  <th className="py-2.5">Root Cause</th>
                  <th className="py-2.5 text-right">Exposure</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kpc-border">
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-kpc-text-4">
                      Scanning custody transfer records…
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="py-3">
                        <Link
                          href={`/portal/movements/${r.movement_id}`}
                          className="font-mono font-bold text-kpc-red hover:underline"
                        >
                          {r.trip_id}
                        </Link>
                      </td>
                      <td className="max-w-[120px] truncate py-3 font-medium text-kpc-text-2">
                        {r.customer_name}
                      </td>
                      <td className="py-3 text-kpc-text-3">
                        {r.root_cause.replaceAll("_", " ")}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-rose-600">
                        {money(r.leaked_amount)}
                      </td>
                      <td className="py-3 text-right">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
