"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  UploadCloud,
  Printer,
  Receipt,
  Building,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { api, ApiError, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/status-badge";
import { ExecutiveHero } from "@/components/executive-hero";
import { KpiCard } from "@/components/kpi-card";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  customer_name: string;
  trip_id: string;
  truck_plate: string;
  total_amount: number;
  currency: string;
  status: string;
  erp_reference: string | null;
  erp_sync_status: string;
  created_at: string;
}

const STATUSES = [
  "ALL",
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "ISSUED",
  "SYNCED_TO_ERP",
  "PAID",
  "DISPUTED",
];

const money = (n: number, c: string) =>
  `${c} ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(n)}`;

export default function BillingPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const canApprove = user && ["Billing Approver", "Finance", "Admin"].includes(user.role);
  const canSyncErp = user && ["Finance", "Admin"].includes(user.role);

  const load = useCallback(() => {
    setLoading(true);
    const q = status === "ALL" ? "" : `?status=${status}`;
    api
      .get<{ data: InvoiceRow[] }>(`/api/v1/invoices${q}`)
      .then((r) => setRows(r.data))
      .catch(() => setMessage({ kind: "error", text: "Could not load invoices from ledger." }))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => load(), [load]);

  async function handleApprove(id: string) {
    setBusyId(id);
    setMessage(null);
    try {
      await api.post(`/api/v1/invoices/${id}/approve`, {});
      setMessage({ kind: "success", text: "Invoice verified and approved for billing ledger." });
      load();
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof ApiError ? e.message : "Could not approve invoice." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleSyncErp(id: string) {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await api.post<{ erp_reference: string }>(`/api/v1/invoices/${id}/sync-erp`, {});
      setMessage({ kind: "success", text: `Successfully posted to SAP S/4HANA under ERP Document ID: ${res.erp_reference}.` });
      load();
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof ApiError ? e.message : "Could not sync to SAP." });
    } finally {
      setBusyId(null);
    }
  }

  const totalInvoiced = rows.reduce((s, i) => s + i.total_amount, 0);

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <ExecutiveHero
        badgeText="SAP S/4HANA RECONCILIATION ENGINE"
        badgeType="live"
        title="Enterprise Billing & Invoices"
        subtitle="Automated demurrage invoice generation, fiscal ledger approval workflows, and instant posting to Kenya Pipeline SAP ERP."
        imageSrc="/images/kpc/kpc_nairobi_headoffice.png"
        imageAlt="Kenpipe Plaza Nairobi Headquarters"
        breadcrumbs={[
          { label: "Command Cockpit", href: "/portal/dashboard" },
          { label: "Billing & Invoices" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SAP CONNECTOR: SYNCHRONIZED</span>
            </span>
          </div>
        }
      />

      {/* Metric Counters — punched gradients */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Demurrage Invoiced"
          value={loading ? "…" : `KES ${(totalInvoiced / 1000000).toFixed(2)}M`}
          subValue="Active invoice batch total"
          icon={Receipt}
          tone="punched-red"
        />
        <KpiCard
          label="Pending Approval"
          value={loading ? "…" : `${rows.filter((r) => r.status === "DRAFT" || r.status === "PENDING_APPROVAL").length} Invoices`}
          subValue="Awaiting sign-off"
          icon={CheckCircle2}
          tone="punched-purple"
        />
        <KpiCard
          label="ERP Synced & Posted"
          value={loading ? "…" : `${rows.filter((r) => r.status === "SYNCED_TO_ERP" || r.status === "PAID").length} Invoices`}
          subValue="Ledger entries verified"
          icon={UploadCloud}
          tone="punched-blue"
        />
        <KpiCard
          label="Average Settlement"
          value="4.2 Days"
          subValue="OMC payment turn time"
          icon={Zap}
          tone="punched-dark"
        />
      </div>

      {/* Filter Control Bar with Quick Status Buttons */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-kpc-text-4">Pipeline Stage:</span>
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
                {st === "ALL" ? "All Invoices" : st.replaceAll("_", " ")}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-kpc-text-3">
            {rows.length} records in view
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 text-xs font-medium ${
            message.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message.kind === "success" ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Zap size={16} className="text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Invoices Dark Glass Table */}
      <div className="glass-panel overflow-hidden rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-kpc-border bg-kpc-surface-2 text-[11px] font-bold uppercase tracking-wider text-kpc-text-3">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">OMC Customer</th>
                <th className="px-5 py-3.5">Vehicle / Trip Ref</th>
                <th className="px-5 py-3.5 text-right">Billed Amount</th>
                <th className="px-5 py-3.5">Lifecycle Status</th>
                <th className="px-5 py-3.5">SAP S/4HANA Ref</th>
                <th className="px-5 py-3.5 text-right">Executive Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kpc-border">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-kpc-text-3">
                    Querying billing ledger…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-kpc-text-3">
                    No invoices match this filter criteria.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono font-bold text-kpc-text">
                      {inv.invoice_number}
                    </td>
                    <td className="max-w-[180px] truncate px-5 py-3.5 font-medium text-kpc-text-2">
                      {inv.customer_name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-kpc-text-3">
                      {inv.truck_plate} &bull; {inv.trip_id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono font-bold text-kpc-text">
                      {money(inv.total_amount, inv.currency)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {inv.erp_reference ? (
                        <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-600">
                          SAP: {inv.erp_reference}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-kpc-text-4">
                          {inv.erp_sync_status.replaceAll("_", " ")}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`${API_BASE_URL}/api/v1/invoices/${inv.id}/print`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-kpc-border bg-kpc-bg text-kpc-text-3 transition-colors hover:border-kpc-red hover:bg-kpc-red hover:text-white"
                          title="Print official demurrage invoice PDF"
                        >
                          <Printer size={13} />
                        </a>
                        {canApprove && inv.status === "DRAFT" && (
                          <button
                            onClick={() => handleApprove(inv.id)}
                            disabled={busyId === inv.id}
                            className="btn-pill flex items-center gap-1.5 border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-600 hover:text-white disabled:opacity-40"
                          >
                            <CheckCircle2 size={13} />
                            <span>Approve</span>
                          </button>
                        )}
                        {canSyncErp && inv.status === "APPROVED" && (
                          <button
                            onClick={() => handleSyncErp(inv.id)}
                            disabled={busyId === inv.id}
                            className="btn-pill flex items-center gap-1.5 bg-kpc-red px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-kpc-red/30 transition-all hover:bg-kpc-red-hover hover:scale-105 disabled:opacity-40"
                          >
                            <UploadCloud size={13} />
                            <span>Post to SAP</span>
                          </button>
                        )}
                      </div>
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
