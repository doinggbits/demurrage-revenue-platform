"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Truck,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { ExecutiveHero } from "@/components/executive-hero";

interface MovementRow {
  id: string;
  trip_id: string;
  truck_plate: string;
  carrier: string;
  customer_name: string;
  depot_name: string;
  product: string;
  status: string;
  gate_in: string;
  gate_out: string | null;
  total_turnaround_mins: number | null;
  demurrage_charged: number | null;
  compliance_status: string | null;
}

interface Depot {
  id: string;
  name: string;
}
interface Contract {
  customer_id: string;
  customer_name: string;
}

const STATUSES = ["ALL", "IN_TRANSIT", "IN_QUEUE", "LOADING", "COMPLETED", "VIOLATED"];
const PRODUCTS = ["ALL", "MOGAS", "AGO", "JET_A1", "DPK"];
const PAGE_SIZE = 15;

const money = (n: number | null) =>
  n == null || n === 0
    ? "KES 0"
    : `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n)}`;

function formatDuration(mins: number | null) {
  if (mins == null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export default function MovementsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "ALL";
  const initialDepot = searchParams.get("depot_id") ?? "ALL";

  const [rows, setRows] = useState<MovementRow[]>([]);
  const [total, setTotal] = useState(0);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [customers, setCustomers] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [depotId, setDepotId] = useState(initialDepot);
  const [customerId, setCustomerId] = useState("ALL");
  const [product, setProduct] = useState("ALL");
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    api.get<{ data: Depot[] }>("/api/v1/depots").then((r) => setDepots(r.data)).catch(() => {});
    api
      .get<{ data: Contract[] }>("/api/v1/contracts")
      .then((r) => {
        const seen = new Set<string>();
        const unique = r.data.filter((c) => (seen.has(c.customer_id) ? false : (seen.add(c.customer_id), true)));
        setCustomers(unique);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (depotId !== "ALL") params.set("depot_id", depotId);
    if (customerId !== "ALL") params.set("customer_id", customerId);
    if (product !== "ALL") params.set("product", product);
    if (status !== "ALL") params.set("status", status);
    if (search) params.set("search", search);

    api
      .get<{ data: MovementRow[]; total: number }>(`/api/v1/movements?${params.toString()}`)
      .then((r) => {
        if (cancelled) return;
        setRows(r.data);
        setTotal(r.total);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load movements.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [depotId, customerId, product, status, search, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  function resetPageAnd<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPage(0);
      setter(v);
    };
  }

  return (
    <div className="space-y-8">
      {/* Executive Photographic Hero Banner */}
      <ExecutiveHero
        badgeText="FLEET INGRESS & DEMURRAGE TELEMETRY"
        badgeType="live"
        title="Truck Movements & Yard Dwell"
        subtitle="Real-time gate telemetry, RFID bay positioning, and automated demurrage fee calculation for all OMC haulage fleets."
        imageSrc="/images/kpc/kpc_parked_trucks_sideview.png"
        imageAlt="Fleet of Fuel Tankers at Kenya Pipeline Loading Bay"
        breadcrumbs={[
          { label: "Command Cockpit", href: "/portal/dashboard" },
          { label: "Truck Movements" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-kpc-border bg-kpc-bg px-4 py-2 text-xs font-semibold text-kpc-text-2">
              <Truck size={14} className="text-kpc-red" />
              <span>{total} Total Movements Logged</span>
            </span>
          </div>
        }
      />

      {/* Filter Control Bar with Dark Glass Styling */}
      <div className="glass-panel rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-kpc-text-3" />
            <input
              placeholder="Search trip ID, truck plate, carrier..."
              value={search}
              onChange={(e) => resetPageAnd(setSearch)(e.target.value)}
              className="w-full rounded-xl border border-kpc-border bg-kpc-bg py-2.5 pl-10 pr-3 text-xs text-kpc-text placeholder-slate-400 focus:border-kpc-red focus:outline-none focus:ring-1 focus:ring-kpc-red/30"
            />
          </div>

          {/* Depot Selector */}
          <div>
            <select
              value={depotId}
              onChange={(e) => resetPageAnd(setDepotId)(e.target.value)}
              className="w-full rounded-xl border border-kpc-border bg-white py-2.5 px-3 text-xs text-kpc-text-2 focus:border-kpc-red focus:outline-none"
            >
              <option value="ALL">All Terminals</option>
              {depots.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* OMC / Customer Selector */}
          <div>
            <select
              value={customerId}
              onChange={(e) => resetPageAnd(setCustomerId)(e.target.value)}
              className="w-full rounded-xl border border-kpc-border bg-white py-2.5 px-3 text-xs text-kpc-text-2 focus:border-kpc-red focus:outline-none"
            >
              <option value="ALL">All OMCs</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>{c.customer_name}</option>
              ))}
            </select>
          </div>

          {/* Product Selector */}
          <div>
            <select
              value={product}
              onChange={(e) => resetPageAnd(setProduct)(e.target.value)}
              className="w-full rounded-xl border border-kpc-border bg-white py-2.5 px-3 text-xs text-kpc-text-2 focus:border-kpc-red focus:outline-none"
            >
              {PRODUCTS.map((p) => (
                <option key={p} value={p}>{p === "ALL" ? "All Products" : p}</option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div>
            <select
              value={status}
              onChange={(e) => resetPageAnd(setStatus)(e.target.value)}
              className="w-full rounded-xl border border-kpc-border bg-white py-2.5 px-3 text-xs text-kpc-text-2 focus:border-kpc-red focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s.replaceAll("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Status Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-kpc-border pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-kpc-text-4">Quick Filter:</span>
          {["ALL", "VIOLATED", "IN_QUEUE", "LOADING", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => resetPageAnd(setStatus)(st)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                status === st
                  ? "bg-kpc-red text-kpc-text shadow-md shadow-kpc-red/25"
                  : "border border-kpc-border bg-kpc-bg text-kpc-text-3 hover:text-kpc-text"
              }`}
            >
              {st.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Main Movements Data Canvas */}
      <div className="glass-panel overflow-hidden rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-kpc-border bg-kpc-surface-2 text-[10px] font-bold uppercase tracking-wider text-kpc-text-3 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Trip ID</th>
                <th className="px-4 py-3">Truck Plate</th>
                <th className="px-4 py-3">OMC Customer</th>
                <th className="px-4 py-3">Terminal</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Gate Ingress</th>
                <th className="px-4 py-3">Turnaround Dwell</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Demurrage Charge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kpc-border">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-kpc-text-3">
                    <span className="inline-block animate-spin mr-2 text-kpc-red">&bull;</span>
                    Fetching gate telemetry records…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-kpc-text-3">
                    No movements match the current filter criteria.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((m) => {
                  const isViolated = m.status === "VIOLATED";
                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors hover:bg-white/[0.03] ${
                        isViolated ? "bg-rose-50" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <Link
                          href={`/portal/movements/${m.id}`}
                          className="font-mono font-bold text-kpc-text hover:text-kpc-red transition-colors"
                        >
                          {m.trip_id}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md border border-kpc-border bg-kpc-surface-2">
                            <Image
                              src="/images/kpc/kpc_close_truck.png"
                              alt="Truck"
                              fill
                              sizes="24px"
                              className="object-cover"
                            />
                          </div>
                          <span className="font-mono font-bold text-kpc-text">{m.truck_plate}</span>
                        </div>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-2.5 font-medium text-kpc-text-2">
                        {m.customer_name}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-2.5 text-kpc-text-3">
                        {m.depot_name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span className="rounded-md border border-kpc-border bg-kpc-bg px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-600">
                          {m.product}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-kpc-text-3">
                        {new Date(m.gate_in).toLocaleString("en-KE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isViolated ? "text-rose-600 font-bold" : "text-kpc-text-2"}`}>
                            {formatDuration(m.total_turnaround_mins)}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono font-bold">
                        {m.demurrage_charged && m.demurrage_charged > 0 ? (
                          <span className="text-rose-600 drop-shadow-[0_0_8px_rgba(227,6,19,0.4)]">
                            {money(m.demurrage_charged)}
                          </span>
                        ) : (
                          <span className="text-kpc-text-4">KES 0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="border-t border-rose-500/20 bg-rose-950/30 px-5 py-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Executive Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-kpc-border bg-kpc-surface-2 px-5 py-4">
          <p className="text-xs text-kpc-text-3 font-medium">
            Showing{" "}
            <strong className="text-kpc-text">
              {total === 0 ? "0" : `${page * PAGE_SIZE + 1}–${Math.min(total, (page + 1) * PAGE_SIZE)}`}
            </strong>{" "}
            of <strong className="text-kpc-text">{total}</strong> movements
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1.5 rounded-xl border border-kpc-border bg-kpc-bg px-3 py-1.5 text-xs font-semibold text-kpc-text-2 transition-colors hover:bg-kpc-bg disabled:opacity-30"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <span className="text-xs font-mono text-kpc-text-3">
              Page <strong className="text-kpc-text">{page + 1}</strong> of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1.5 rounded-xl border border-kpc-border bg-kpc-bg px-3 py-1.5 text-xs font-semibold text-kpc-text-2 transition-colors hover:bg-kpc-bg disabled:opacity-30"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
