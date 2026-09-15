"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileCheck2,
  Clock,
  Hash,
  Award,
  Layers,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { ExecutiveHero } from "@/components/executive-hero";

interface StepTrace {
  step_num: number;
  name: string;
  description: string;
  formula: string;
  inputs: Record<string, unknown>;
  output_value: string;
}

interface ComplianceRule {
  rule_id: string;
  rule_name: string;
  category: string;
  status: "PASS" | "FAIL";
  weight: number;
  earned_score: number;
  details: string;
  evidence_ref: string;
}

interface MovementDetail {
  id: string;
  trip_id: string;
  truck_plate: string;
  carrier: string;
  customer_name: string;
  depot_name: string;
  depot_code: string;
  product: string;
  status: string;
  gate_in: string;
  queue_start: string | null;
  loading_start: string | null;
  loading_end: string | null;
  gate_out: string | null;
  contract_code: string;
  free_time_mins: number;
  grace_period_mins: number;
  demurrage_rate_per_hr: number;
  geofence_verified: number;
  weight_ticket_verified: number;
  gate_pass_verified: number;
  step_trace_json: string | null;
  demurrage_charged: number | null;
  net_excess_mins: number | null;
  billable_hours: number | null;
  input_hash: string | null;
  audit_signature: string | null;
  compliance_score: number | null;
  compliance_status: string | null;
  rules_json: string | null;
  invoice_number: string | null;
  invoice_status: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  performed_by: string;
  user_role: string;
  details: string;
  timestamp: string;
}

const money = (n: number | null) =>
  n == null ? "KES 0.00" : `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(n)}`;

function fmtTime(ts: string | null) {
  if (!ts) return null;
  return new Date(ts).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" });
}

export default function TruckDetailPage() {
  const params = useParams<{ id: string }>();
  const [m, setM] = useState<MovementDetail | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<MovementDetail>(`/api/v1/movements/${params.id}`),
      api.get<{ data: AuditEntry[] }>(`/api/v1/movements/${params.id}/audit-trail`),
    ])
      .then(([mv, at]) => {
        if (cancelled) return;
        setM(mv);
        setAudit(at.data);
      })
      .catch(() => !cancelled && setError("Could not load movement details."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center text-sm text-kpc-text-3">
        Decrypting forensic custody log…
      </div>
    );
  }

  if (error || !m) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/60 p-4 text-xs text-rose-300">
        {error ?? "Trip movement record not found."}
      </div>
    );
  }

  const steps: StepTrace[] = m.step_trace_json ? JSON.parse(m.step_trace_json) : [];
  const rules: ComplianceRule[] = m.rules_json ? JSON.parse(m.rules_json) : [];

  const turnaroundStages = [
    { label: "Gate Ingress", done: true, time: m.gate_in },
    { label: "Weighbridge Scale", done: !!m.weight_ticket_verified, time: m.queue_start },
    { label: "Gantry Loading", done: !!m.loading_start || m.status !== "IN_QUEUE", time: m.loading_start },
    { label: "Lab Verification", done: !!m.gate_pass_verified, time: m.loading_end },
    { label: "Gate Egress", done: !!m.gate_out, time: m.gate_out },
  ];

  const freeTimePct =
    m.net_excess_mins != null
      ? Math.min(100, (m.free_time_mins / (m.free_time_mins + Math.max(0, m.net_excess_mins))) * 100)
      : 100;
  const overFreeTime = (m.net_excess_mins ?? 0) > 0;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/portal/movements"
          className="inline-flex items-center gap-2 rounded-full border border-kpc-border bg-kpc-bg px-4 py-1.5 text-xs font-semibold text-kpc-text-2 transition-colors hover:border-kpc-red hover:text-kpc-text"
        >
          <ArrowLeft size={13} />
          <span>Return to Movements Radar</span>
        </Link>
      </div>

      {/* Forensic Trip Hero */}
      <ExecutiveHero
        badgeText={m.status === "VIOLATED" ? "EXCESS DWELL DETECTED" : "COMPLIANT TRIP RECORD"}
        badgeType={m.status === "VIOLATED" ? "alert" : "live"}
        title={`${m.truck_plate} · Trip ${m.trip_id}`}
        subtitle={`${m.customer_name} &bull; Haulier: ${m.carrier} &bull; Terminal: ${m.depot_name} (${m.depot_code}) &bull; Cargo: ${m.product}`}
        imageSrc="/images/kpc/kpc_close_truck.png"
        imageAlt="KPC Transport Tanker"
        breadcrumbs={[
          { label: "Movements", href: "/portal/movements" },
          { label: `Trip ${m.trip_id}` },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={m.status} />
            {m.compliance_status && <StatusBadge status={m.compliance_status} />}
          </div>
        }
      />

      {/* Operational Stage Stepper */}
      <div className="glass-panel rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-kpc-border pb-4">
          <h2 className="text-base font-bold text-kpc-text">Gantry Lifecycle Sequence</h2>
          <span className="font-mono text-xs text-kpc-text-3">RFID GATE &rarr; METERING BAY</span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          {turnaroundStages.map((s, i) => (
            <div key={s.label} className="flex flex-1 min-w-[120px] items-center">
              <div className="flex flex-col items-center gap-2 text-center w-full">
                {s.done ? (
                  <CheckCircle2 size={24} className="text-emerald-600 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                ) : (
                  <Circle size={24} className="text-kpc-text-4" />
                )}
                <div>
                  <p className={`text-xs font-bold ${s.done ? "text-kpc-text" : "text-kpc-text-4"}`}>{s.label}</p>
                  {s.time ? (
                    <p className="font-mono text-[10px] text-kpc-text-3">{fmtTime(s.time)}</p>
                  ) : (
                    <p className="text-[10px] text-kpc-text-4">Pending</p>
                  )}
                </div>
              </div>
              {i < turnaroundStages.length - 1 && (
                <div className={`hidden sm:block h-0.5 w-8 shrink-0 ${s.done ? "bg-emerald-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Free Time Dwell Progress Gauge */}
        <div className="mt-8 border-t border-kpc-border pt-6">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-kpc-text-2">Contract Free Time Allocation</span>
            <span className={`font-mono font-bold ${overFreeTime ? "text-rose-600" : "text-emerald-600"}`}>
              {overFreeTime
                ? `+${m.net_excess_mins} MINS OVER LIMIT (${m.free_time_mins}m allowance)`
                : `WITHIN CONTRACT LIMIT (${m.free_time_mins}m allowance)`}
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overFreeTime ? "bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" : "bg-emerald-400"
              }`}
              style={{ width: `${freeTimePct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* 12-Step Mathematical Calculation Trace */}
        <div className="glass-panel rounded-2xl p-6 shadow-sm lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-kpc-border pb-4">
            <div>
              <h2 className="text-base font-bold text-kpc-text">12-Step Deterministic Calculation Trace</h2>
              <p className="text-xs text-kpc-text-3">Verifiable arithmetic signed by the revenue assurance engine</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[#E30613] via-[#F43F5E] to-[#FB7185] px-5 py-3 text-right shadow-lg shadow-kpc-red/30">
              <span className="font-mono text-xl font-black text-kpc-text tracking-tight">
                {money(m.demurrage_charged)}
              </span>
              <span className="mt-0.5 block text-[10px] uppercase font-bold text-kpc-text/80">Demurrage Assessed</span>
            </div>
          </div>

          <ol className="mt-6 space-y-4">
            {steps.map((s) => (
              <li key={s.step_num} className="rounded-2xl border border-kpc-border bg-kpc-bg p-3.5 transition-colors hover:border-kpc-border">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-xs font-bold text-kpc-text">
                    Step {s.step_num}: {s.name}
                  </span>
                  <span className="font-mono text-xs font-bold text-sky-600">{s.output_value}</span>
                </div>
                <p className="mt-1 text-xs text-kpc-text-2">{s.description}</p>
                <div className="mt-2 rounded-lg bg-kpc-surface-2 p-2 font-mono text-[10px] text-kpc-text-3">
                  Formula: {s.formula}
                </div>
              </li>
            ))}
          </ol>

          {/* Cryptographic Proof Hashes */}
          {(m.input_hash || m.audit_signature) && (
            <div className="mt-6 space-y-2 rounded-2xl border border-kpc-border bg-kpc-surface-2 p-4 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-kpc-text-3 text-[11px]">Input Telemetry Hash (SHA-256):</span>
                <span className="truncate text-kpc-text-2 text-[10px]">{m.input_hash}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-kpc-text-3 text-[11px]">Engine Audit Signature (SHA-256):</span>
                <span className="truncate text-emerald-600 text-[10px]">{m.audit_signature}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Evidence & Governance */}
        <div className="space-y-6 lg:col-span-4">
          {/* Verified Telemetry Evidence */}
          <div className="glass-panel rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-kpc-text border-b border-kpc-border pb-3">
              Forensic Custody Evidence
            </h2>
            <div className="mt-4 space-y-3 text-xs">
              {[
                ["GPS Geofence Ingress", m.geofence_verified],
                ["Weighbridge Scale Ticket", m.weight_ticket_verified],
                ["Electronic Gantry Gate Pass", m.gate_pass_verified],
              ].map(([label, ok]) => (
                <div key={label as string} className="flex items-center justify-between rounded-xl bg-kpc-bg p-3">
                  <span className="text-kpc-text-2">{label}</span>
                  {ok ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-600">
                      <FileCheck2 size={13} /> VERIFIED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-bold text-rose-600">
                      <ShieldAlert size={13} /> MISSING
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Association */}
          {m.invoice_number && (
            <div className="glass-panel rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-kpc-text border-b border-kpc-border pb-3">
                Commercial Invoice
              </h2>
              <p className="mt-3 font-mono text-sm font-bold text-sky-600">{m.invoice_number}</p>
              <div className="mt-2">
                <StatusBadge status={m.invoice_status} />
              </div>
            </div>
          )}

          {/* Audit Trail Timeline */}
          <div className="glass-panel rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-kpc-text border-b border-kpc-border pb-3">
              Security Audit Trail
            </h2>
            <div className="mt-4 space-y-3">
              {audit.map((a) => (
                <div key={a.id} className="border-b border-kpc-border pb-3 last:border-0 last:pb-0 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-kpc-text">{a.action.replaceAll("_", " ")}</span>
                    <span className="font-mono text-[10px] text-kpc-text-4">{fmtTime(a.timestamp)}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-kpc-text-3">By {a.performed_by} ({a.user_role})</p>
                  <p className="mt-1 text-[11px] text-kpc-text-2">{a.details}</p>
                </div>
              ))}
              {audit.length === 0 && (
                <p className="text-xs text-kpc-text-4">No manual audit alterations recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
