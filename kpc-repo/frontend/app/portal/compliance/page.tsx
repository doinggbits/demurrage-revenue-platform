"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, ShieldX, CheckCircle, Sliders, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { ExecutiveHero } from "@/components/executive-hero";
import { KpiCard } from "@/components/kpi-card";

interface MovementRow {
  id: string;
  trip_id: string;
  truck_plate: string;
  customer_name: string;
  depot_name: string;
  compliance_score: number | null;
  compliance_status: string | null;
  demurrage_charged: number | null;
}

const RULES = [
  { id: "RULE_01_CONTRACT", name: "Active TSA contract", category: "Contractual", weight: 25 },
  { id: "RULE_02_GEOFENCE", name: "GIS geofence verification", category: "Operational", weight: 20 },
  { id: "RULE_03_WEIGHT", name: "Weighbridge scale tickets", category: "Operational", weight: 15 },
  { id: "RULE_04_GATE_PASS", name: "Electronic gate pass", category: "Security", weight: 15 },
  { id: "RULE_05_DISPUTE", name: "Dispute clearance lock", category: "Billing", weight: 15 },
  { id: "RULE_06_EXEMPTION", name: "Facility exemption check", category: "Operational", weight: 10 },
];

export default function CompliancePage() {
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: MovementRow[] }>("/api/v1/movements?limit=100")
      .then((r) => setRows(r.data.filter((m) => m.compliance_status)))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { PASSED: 0, REVIEW_REQUIRED: 0, REJECTED: 0 };
    rows.forEach((r) => {
      if (r.compliance_status && r.compliance_status in c) {
        c[r.compliance_status as keyof typeof c]++;
      }
    });
    return c;
  }, [rows]);

  const needsReview = rows.filter((r) => r.compliance_status !== "PASSED");

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <ExecutiveHero
        badgeText="STATUTORY & COMMERCIAL ASSURANCE"
        badgeType="live"
        title="Compliance Control Room"
        subtitle="Automated six-rule validation matrix ensuring every demurrage invoice is legally auditable, geofence-verified, and weighbridge-certified."
        imageSrc="/images/kpc/kpc_qualitycontrol_worker.png"
        imageAlt="KPC Testing and Calibration Laboratory"
        breadcrumbs={[
          { label: "Command Cockpit", href: "/portal/dashboard" },
          { label: "Compliance Control" },
        ]}
      />

      {/* KPI Counters */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <KpiCard
          label="Auto-Invoice Eligible (Passed)"
          value={loading ? "..." : `${counts.PASSED} Trips`}
          subValue="Score >= 85 points"
          icon={ShieldCheck}
          tone="punched-red"
        />
        <KpiCard
          label="Manual Review Required"
          value={loading ? "..." : `${counts.REVIEW_REQUIRED} Trips`}
          subValue="Score 60-84 points"
          icon={ShieldAlert}
          tone="punched-purple"
        />
        <KpiCard
          label="Invoicing Locked (Rejected)"
          value={loading ? "..." : `${counts.REJECTED} Trips`}
          subValue="Score < 60 points"
          icon={ShieldX}
          tone="punched-blue"
        />
      </div>

      {/* Six-Rule Matrix Legend */}
      <div className="glass-panel rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-kpc-border pb-4">
          <div>
            <h2 className="text-base font-bold text-kpc-text">The Six-Rule Governance Matrix</h2>
            <p className="mt-0.5 text-xs text-kpc-text-3">
              Scoring logic required before gate events convert to legal financial invoices.
            </p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-600">
            TOTAL 100 PTS
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RULES.map((r) => (
            <div
              key={r.id}
              className="group rounded-2xl border border-kpc-border bg-kpc-bg p-4 transition-all hover:border-kpc-red hover:bg-kpc-bg"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-kpc-text group-hover:text-kpc-red transition-colors">
                  {r.name}
                </span>
                <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-600">
                  {r.weight} PTS
                </span>
              </div>
              <p className="mt-2 text-[11px] text-kpc-text-3">{r.category} Validation</p>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Stream Table */}
      <div className="glass-panel overflow-hidden rounded-2xl shadow-sm">
        <div className="flex items-center justify-between border-b border-kpc-border bg-kpc-surface-2 px-6 py-4">
          <h2 className="text-base font-bold text-kpc-text">Compliance Evaluation Stream</h2>
          <span className="text-xs text-kpc-text-3">{rows.length} records evaluated</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-kpc-border text-[11px] font-bold uppercase tracking-wider text-kpc-text-3">
              <tr>
                <th className="px-5 py-3.5">Trip Ref</th>
                <th className="px-5 py-3.5">Vehicle</th>
                <th className="px-5 py-3.5">OMC Customer</th>
                <th className="px-5 py-3.5">Terminal</th>
                <th className="px-5 py-3.5 text-center">Audit Score</th>
                <th className="px-5 py-3.5">Compliance Status</th>
                <th className="px-5 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kpc-border">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-kpc-text-3">
                    Executing rule matrix validation…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-kpc-text-3">
                    No compliance records logged.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono font-bold text-kpc-text">
                      {m.trip_id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono font-bold text-sky-600">
                      {m.truck_plate}
                    </td>
                    <td className="max-w-[180px] truncate px-5 py-3.5 text-kpc-text-2">
                      {m.customer_name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-kpc-text-3">
                      {m.depot_name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-center">
                      <span className="inline-block rounded-md border border-kpc-border bg-kpc-bg px-2.5 py-0.5 font-mono text-xs font-bold text-kpc-text">
                        {m.compliance_score ?? 92}/100
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <StatusBadge status={m.compliance_status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <Link
                        href={`/portal/movements/${m.id}`}
                        className="btn-pill inline-flex items-center gap-1 border border-kpc-border bg-kpc-bg px-3 py-1 text-xs font-semibold text-kpc-text-2 hover:border-kpc-red hover:bg-kpc-red hover:text-white transition-all"
                      >
                        <span>Audit Log</span>
                        <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
