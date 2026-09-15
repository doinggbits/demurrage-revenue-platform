"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Gavel,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Scale,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/status-badge";
import { ExecutiveHero } from "@/components/executive-hero";
import { KpiCard } from "@/components/kpi-card";

interface Dispute {
  id: string;
  dispute_number: string;
  customer_name: string;
  reason_code: string;
  description: string;
  disputed_amount: number;
  status: string;
  invoice_number: string | null;
  truck_plate: string | null;
  created_by: string;
  created_at: string;
}

const STATUSES = [
  "ALL",
  "DETECTED",
  "UNDER_REVIEW",
  "EVIDENCE_COLLECTED",
  "APPROVED",
  "REJECTED",
  "ADJUSTED",
  "CLOSED",
];

const money = (n: number) =>
  `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n)}`;

export default function DisputesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Dispute[]>([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canAdjudicate = user && ["Billing Approver", "Finance", "Admin"].includes(user.role);

  const load = useCallback(() => {
    setLoading(true);
    const q = status === "ALL" ? "" : `?status=${status}`;
    api
      .get<{ data: Dispute[] }>(`/api/v1/disputes${q}`)
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => load(), [load]);

  async function handleResolve(id: string, newStatus: string) {
    setBusyId(id);
    setMessage(null);
    try {
      await api.post(`/api/v1/disputes/${id}/resolve`, {
        new_status: newStatus,
        resolution_notes: `Marked ${newStatus.toLowerCase()} by ${user?.full_name}`,
      });
      setMessage(`Dispute successfully updated to ${newStatus.replaceAll("_", " ")}.`);
      load();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Could not update this dispute.");
    } finally {
      setBusyId(null);
    }
  }

  const totalDisputed = rows.reduce((s, d) => s + d.disputed_amount, 0);

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <ExecutiveHero
        badgeText="COMMERCIAL ADJUDICATION WAR ROOM"
        badgeType="alert"
        title="Disputes & Claims Adjudication"
        subtitle="Independent forensic review of OMC demurrage contestations, weighbridge scale discrepancies, and gantry outage claims."
        imageSrc="/images/kpc/kpc_petroltruck1.png"
        imageAlt="Metered Gantry Bay Loading Arm and Flow Verification"
        breadcrumbs={[
          { label: "Command Cockpit", href: "/portal/dashboard" },
          { label: "Disputes" },
        ]}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <KpiCard
          label="Total Value in Dispute"
          value={loading ? "..." : money(totalDisputed)}
          subValue="Active carrier claims"
          icon={Scale}
          tone="punched-red"
        />
        <KpiCard
          label="Awaiting Adjudication"
          value={loading ? "..." : `${rows.filter((r) => r.status === "DETECTED" || r.status === "UNDER_REVIEW").length} Claims`}
          subValue="Requires Billing Approver sign-off"
          icon={Clock}
          tone="punched-purple"
        />
        <KpiCard
          label="Adjudication Resolution Rate"
          value="94.2%"
          subValue="Settled within 48-hour SLA"
          icon={ShieldCheck}
          tone="punched-blue"
        />
      </div>

      {/* Status Filter Bar */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-kpc-text-4">Claim Stage:</span>
            {STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => setStatus(st)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  status === st
                    ? "bg-kpc-red text-white shadow-md shadow-kpc-red/25"
                    : "border border-kpc-border bg-kpc-bg text-kpc-text-3 hover:text-kpc-text"
                }`}
              >
                {st === "ALL" ? "All Claims" : st.replaceAll("_", " ")}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-kpc-text-3">{rows.length} claims in view</span>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 shadow-sm">
          {message}
        </div>
      )}

      {/* Disputes Adjudication Cards */}
      <div className="space-y-4">
        {loading && (
          <div className="glass-panel rounded-2xl p-12 text-center text-sm text-kpc-text-3">
            Scanning commercial claim filings…
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="glass-panel rounded-2xl p-12 text-center text-sm text-kpc-text-3">
            No active disputes found matching this filter criteria.
          </div>
        )}
        {rows.map((d) => (
          <div
            key={d.id}
            className="glass-panel group rounded-2xl p-6 transition-all hover:border-kpc-red/30 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-extrabold text-kpc-text group-hover:text-kpc-red transition-colors">
                    {d.dispute_number}
                  </span>
                  <StatusBadge status={d.status} />
                  <span className="rounded-md border border-kpc-border bg-kpc-bg px-2 py-0.5 font-mono text-[10px] text-kpc-text-3">
                    Reason: {d.reason_code.replaceAll("_", " ")}
                  </span>
                </div>

                <p className="text-xs text-kpc-text-2">
                  <strong className="text-kpc-text">{d.customer_name}</strong>
                  {d.truck_plate && (
                    <span> &bull; Vehicle: <strong className="font-mono text-sky-600">{d.truck_plate}</strong></span>
                  )}
                  {d.invoice_number && (
                    <span> &bull; Invoice: <strong className="font-mono text-kpc-text-2">{d.invoice_number}</strong></span>
                  )}
                </p>

                <p className="max-w-2xl text-xs leading-relaxed text-kpc-text-3">
                  &ldquo;{d.description}&rdquo;
                </p>
              </div>

              {/* Amount & Actions */}
              <div className="text-right space-y-3 shrink-0">
                <div>
                  <span className="block font-mono text-xl font-black text-rose-600 drop-shadow-[0_0_8px_rgba(227,6,19,0.4)]">
                    {money(d.disputed_amount)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-kpc-text-4 font-semibold">
                    Disputed Amount
                  </span>
                </div>

                {canAdjudicate && d.status !== "APPROVED" && d.status !== "REJECTED" && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleResolve(d.id, "REJECTED")}
                      disabled={busyId === d.id}
                      className="btn-pill flex items-center gap-1 border border-kpc-border bg-kpc-bg px-3 py-1 text-xs font-semibold text-kpc-text-2 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition-all"
                    >
                      <XCircle size={13} />
                      <span>Reject Claim</span>
                    </button>
                    <button
                      onClick={() => handleResolve(d.id, "APPROVED")}
                      disabled={busyId === d.id}
                      className="btn-pill flex items-center gap-1 bg-kpc-red px-3.5 py-1 text-xs font-bold text-white shadow-md shadow-kpc-red/25 hover:bg-kpc-red-hover transition-all"
                    >
                      <CheckCircle2 size={13} />
                      <span>Approve Waiver</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
