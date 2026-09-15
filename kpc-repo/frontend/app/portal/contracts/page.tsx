"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { FileText, Pencil, X, Check, Building, ShieldCheck, Clock, Percent } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "@/components/status-badge";
import { ExecutiveHero } from "@/components/executive-hero";
import { KpiCard } from "@/components/kpi-card";

interface Contract {
  id: string;
  code: string;
  customer_id: string;
  customer_name: string;
  version: string;
  free_time_mins: number;
  grace_period_mins: number;
  grace_cliff: number;
  demurrage_rate_per_hr: number;
  detention_rate_per_day: number;
  max_cap_amount: number;
  tax_rate: number;
  effective_date: string;
  expiry_date: string;
  status: string;
}

const money = (n: number) => `KES ${new Intl.NumberFormat("en-KE").format(n)}`;

export default function ContractsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = user?.role === "Admin";

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ data: Contract[] }>("/api/v1/contracts")
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/v1/contracts", editing);
      setEditing(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save commercial agreement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <ExecutiveHero
        badgeText="COMMERCIAL TARIFF & TSA VAULT"
        badgeType="live"
        title="Transport & Storage Agreements (TSAs)"
        subtitle="The binding commercial and tariff rules governing turnaround limits, hourly demurrage rates, and grace periods for each Oil Marketing Company."
        imageSrc="/images/kpc/kpc_nakuru_office.png"
        imageAlt="KPC Regional Loading Depot and Administrative Office"
        breadcrumbs={[
          { label: "Command Cockpit", href: "/portal/dashboard" },
          { label: "Contracts (TSAs)" },
        ]}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <KpiCard
          label="Active Oil Marketing Companies"
          value={loading ? "..." : `${rows.filter((c) => c.status === "ACTIVE").length} OMCs`}
          subValue="Total, Vivo, Rubis, Ola, etc."
          icon={Building}
          tone="punched-red"
        />
        <KpiCard
          label="Standard Free Time Limit"
          value="180 Mins"
          subValue="Contractual baseline (3 hours)"
          icon={Clock}
          tone="punched-purple"
        />
        <KpiCard
          label="Standard Demurrage Tariff"
          value="KES 3,500/hr"
          subValue="+16% VAT applicable"
          icon={Percent}
          tone="punched-blue"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Contracts Table */}
      <div className="glass-panel overflow-hidden rounded-2xl shadow-sm">
        <div className="flex items-center justify-between border-b border-kpc-border bg-kpc-surface-2 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-kpc-text">Commercial Tariff Registry</h2>
            <p className="text-xs text-kpc-text-3">Official TSA parameters loaded into the revenue engine</p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-600">
            {rows.length} CONTRACTS ACTIVE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-kpc-border text-[11px] font-bold uppercase tracking-wider text-kpc-text-3">
              <tr>
                <th className="px-5 py-3.5">OMC Customer</th>
                <th className="px-5 py-3.5">Agreement Code</th>
                <th className="px-5 py-3.5">Free Time</th>
                <th className="px-5 py-3.5">Grace Period</th>
                <th className="px-5 py-3.5">Demurrage Tariff</th>
                <th className="px-5 py-3.5">Maximum Cap</th>
                <th className="px-5 py-3.5">Status</th>
                {canEdit && <th className="px-5 py-3.5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-kpc-border">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-kpc-text-3">
                    Loading commercial agreements…
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-5 py-3.5 font-bold text-kpc-text">
                      {c.customer_name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-sky-600">
                      {c.code}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-kpc-text-2">
                      {c.free_time_mins} mins
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-kpc-text-3">
                      {c.grace_period_mins} mins
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono font-bold text-kpc-text">
                      {money(c.demurrage_rate_per_hr)}/hr
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-kpc-text-3">
                      {c.max_cap_amount > 0 ? money(c.max_cap_amount) : "Uncapped"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    {canEdit && (
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <button
                          onClick={() => setEditing(c)}
                          className="btn-pill inline-flex items-center gap-1.5 border border-kpc-border bg-kpc-bg px-3 py-1 text-xs font-semibold text-kpc-text-2 hover:border-kpc-red hover:bg-kpc-red hover:text-white transition-all"
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Commercial Terms Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-kpc-border bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-kpc-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-kpc-text">Modify Agreement Terms</h3>
                <p className="text-xs text-kpc-text-3">{editing.customer_name} ({editing.code})</p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="rounded-full p-1.5 text-kpc-text-3 hover:bg-kpc-bg hover:text-kpc-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-kpc-text-2">Free Time (Minutes)</label>
                  <input
                    type="number"
                    value={editing.free_time_mins}
                    onChange={(e) => setEditing({ ...editing, free_time_mins: Number(e.target.value) })}
                    className="mt-1.5 w-full rounded-xl border border-kpc-border bg-white p-2.5 text-kpc-text focus:border-kpc-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-kpc-text-2">Grace Period (Minutes)</label>
                  <input
                    type="number"
                    value={editing.grace_period_mins}
                    onChange={(e) => setEditing({ ...editing, grace_period_mins: Number(e.target.value) })}
                    className="mt-1.5 w-full rounded-xl border border-kpc-border bg-white p-2.5 text-kpc-text focus:border-kpc-red focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-kpc-text-2">Demurrage Rate / Hour (KES)</label>
                  <input
                    type="number"
                    value={editing.demurrage_rate_per_hr}
                    onChange={(e) => setEditing({ ...editing, demurrage_rate_per_hr: Number(e.target.value) })}
                    className="mt-1.5 w-full rounded-xl border border-kpc-border bg-white p-2.5 text-kpc-text focus:border-kpc-red focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-kpc-text-2">Maximum Demurrage Cap (KES)</label>
                  <input
                    type="number"
                    value={editing.max_cap_amount}
                    onChange={(e) => setEditing({ ...editing, max_cap_amount: Number(e.target.value) })}
                    className="mt-1.5 w-full rounded-xl border border-kpc-border bg-white p-2.5 text-kpc-text focus:border-kpc-red focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-kpc-border pt-4">
              <button
                onClick={() => setEditing(null)}
                className="btn-pill border border-kpc-border px-4 py-2 text-xs font-semibold text-kpc-text-2 hover:bg-kpc-bg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-pill flex items-center gap-1.5 bg-kpc-red px-5 py-2 text-xs font-bold text-white shadow-lg shadow-kpc-red/30 hover:bg-kpc-red-hover disabled:opacity-50"
              >
                <Check size={14} />
                <span>{saving ? "Saving…" : "Save Commercial Terms"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
