"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Share2,
  Database,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Layers,
  RefreshCw,
  Clock,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { api, ApiError, API_BASE_URL, getToken } from "@/lib/api";
import { ExecutiveHero } from "@/components/executive-hero";
import { KpiCard } from "@/components/kpi-card";

interface IngestResult {
  filename: string;
  rows_processed: number;
  movements_accepted: number;
  calculations_run: number;
  rows_rejected: number;
  errors: { row: number; trip_id: string; error: string }[];
  scenario?: {
    id: string;
    title: string;
    terminal: string;
    badge: string;
  };
}

interface Scenario {
  id: string;
  title: string;
  terminal: string;
  depot_code: string;
  description: string;
  badge: string;
  truck_count: number;
  sample_plate: string;
}

export default function ReportsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("nairobi_weekend_surge");
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [ingestingScenario, setIngestingScenario] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ data: Scenario[] }>("/api/v1/scenarios")
      .then((res) => {
        setScenarios(res.data);
        if (res.data.length > 0) setSelectedScenarioId(res.data[0].id);
      })
      .catch(() => {
        // Fallback default scenarios
        setScenarios([
          {
            id: "nairobi_weekend_surge",
            title: "Nairobi Terminal (NBI-PS10) – Weekend Peak Congestion",
            terminal: "Nairobi (Embakasi)",
            depot_code: "NBI-PS10",
            description: "High tanker congestion and Line 5 switch delays generating significant demurrage spikes.",
            badge: "High Demurrage & Bottlenecks",
            truck_count: 12,
            sample_plate: "KDF 412X / KBZ 981P",
          },
          {
            id: "mombasa_maritime_inflow",
            title: "Mombasa Kipevu (KOSF-PS01) – Maritime Bulk Discharge",
            terminal: "Kipevu, Mombasa",
            depot_code: "KOSF-PS01",
            description: "Fast maritime manifold discharge with high volume and minimal turnaround delays.",
            badge: "High Throughput / Low Demurrage",
            truck_count: 14,
            sample_plate: "KDA 102M / KDG 554B",
          },
          {
            id: "kisumu_crossborder_delay",
            title: "Kisumu Lake Jetty (KIS-PS28) – Cross-Border Adulteration Dips",
            terminal: "Kisumu Lake Jetty",
            depot_code: "KIS-PS28",
            description: "Transit tankers with extended dwell times due to KRA ECTS seal testing and fuel marker dips.",
            badge: "Compliance Audits & Spikes",
            truck_count: 10,
            sample_plate: "UBC 782K / KDC 903R",
          },
          {
            id: "eldoret_optimized_flow",
            title: "Eldoret Gateway (ELD-PS27) – Fast-Track Automated Corridor",
            terminal: "Eldoret Terminal",
            depot_code: "ELD-PS27",
            description: "Optimal automated bay loading with zero demurrage and high throughput compliance.",
            badge: "Optimal SLA / Zero Demurrage",
            truck_count: 12,
            sample_plate: "KDD 331T / KDH 820Q",
          },
        ]);
      })
      .finally(() => setLoadingScenarios(false));
  }, []);

  async function handleLoadScenario() {
    setIngestingScenario(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post<IngestResult>(`/api/v1/scenarios/${selectedScenarioId}/load`, {});
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not ingest demo scenario.");
    } finally {
      setIngestingScenario(false);
    }
  }

  async function handleDownloadScenarioCsv() {
    const url = `${API_BASE_URL}/api/v1/scenarios/${selectedScenarioId}/csv`;
    window.open(url, "_blank");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post<IngestResult>("/api/v1/ingest/csv", form);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not ingest gate log file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleExport(path: string, filename: string) {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      setError("Nothing to export for this dataset yet.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <ExecutiveHero
        badgeText="TELEMETRY INGEST & FINANCIAL RECONCILIATION"
        badgeType="live"
        title="Data Upload, Ingest & Operational Reports"
        subtitle="Ingest multi-scenario operational gate logs, test turnaround calculations against various depot conditions, or export board-level demurrage reconciliations."
        imageSrc="/images/kpc/kpc_industry1.png"
        imageAlt="Kenya Pipeline Vast Pipeline Infrastructure"
        breadcrumbs={[
          { label: "Command Cockpit", href: "/portal/dashboard" },
          { label: "Reports & Ingestion" },
        ]}
      />

      {/* Punched Berry KPI Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <KpiCard
          label="Operational Presets"
          value="4 Scenarios"
          subValue="Nairobi, Mombasa, Kisumu, Eldoret"
          icon={FileSpreadsheet}
          tone="punched-purple"
        />
        <KpiCard
          label="Engine Reconciliations"
          value="100% Deterministic"
          subValue="12-Step TSA Arithmetic with SHA-256"
          icon={FileCheck}
          tone="punched-blue"
        />
        <KpiCard
          label="Telemetry Formats"
          value="CSV / SCADA Stream"
          subValue="Weighbridge tare, RFID & Gantry meters"
          icon={Database}
          tone="punched-cyan"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Ingestion Results Notification Banner */}
      {result && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-6 shadow-sm animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-200/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">
                  Data Ingestion &amp; Calculation Completed Successfully!
                </h3>
                <p className="text-xs text-emerald-700">
                  Ingested file: <span className="font-mono font-bold">{result.filename}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/portal/movements"
                className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                View Movements &rarr;
              </Link>
              <Link
                href="/portal/ai-intelligence"
                className="rounded-full border border-emerald-300 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-colors"
              >
                AI Anomalies &rarr;
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs font-mono">
            <div className="rounded-xl bg-white p-3 border border-emerald-100">
              <span className="block text-[10px] uppercase text-emerald-600 font-sans font-semibold">Rows Ingested</span>
              <strong className="text-base text-emerald-950">{result.rows_processed}</strong>
            </div>
            <div className="rounded-xl bg-white p-3 border border-emerald-100">
              <span className="block text-[10px] uppercase text-emerald-600 font-sans font-semibold">Movements Saved</span>
              <strong className="text-base text-emerald-950">{result.movements_accepted}</strong>
            </div>
            <div className="rounded-xl bg-white p-3 border border-emerald-100">
              <span className="block text-[10px] uppercase text-emerald-600 font-sans font-semibold">12-Step Calculations</span>
              <strong className="text-base text-emerald-950">{result.calculations_run}</strong>
            </div>
            <div className="rounded-xl bg-white p-3 border border-emerald-100">
              <span className="block text-[10px] uppercase text-emerald-600 font-sans font-semibold">Exceptions / Rejects</span>
              <strong className="text-base text-emerald-950">{result.rows_rejected}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Area: Multi-Scenario Presets (Left) + Custom Upload (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT 7 COLUMNS: DEMO OPERATIONAL SCENARIOS DROPDOWN */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 mb-1">
                <Sparkles size={12} /> Dynamic Telemetry Simulator
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Preset Operational Scenarios Dropdown
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Select &amp; Ingest
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Experience how different loading terminal conditions immediately alter turnaround dwell times, demurrage billables, and AI anomaly detection models across the platform.
          </p>

          {/* Dropdown Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Choose Pre-Configured Operational Batch:
            </label>
            <div className="relative">
              <select
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 pr-10 text-xs font-bold text-slate-800 shadow-sm focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                {scenarios.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.title} ({sc.truck_count} Tankers)
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* Scenario Details Box */}
          {currentScenario && (
            <div className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{currentScenario.terminal}</span>
                <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-600">
                  {currentScenario.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentScenario.description}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 font-mono">
                <div>
                  <span className="block text-[10px] text-slate-400 font-sans">Batch Size</span>
                  <strong className="text-slate-800 font-semibold">{currentScenario.truck_count} Heavy Tankers</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-sans">Sample Fleet Plates</span>
                  <strong className="text-slate-800 font-semibold">{currentScenario.sample_plate}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={ingestingScenario}
              onClick={handleLoadScenario}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 py-3 px-5 text-xs font-bold text-white shadow-sm hover:from-rose-700 hover:to-rose-800 transition-all disabled:opacity-50"
            >
              {ingestingScenario ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Processing Scenario Batch &amp; Recalculating...</span>
                </>
              ) : (
                <>
                  <Database size={14} />
                  <span>Load &amp; Ingest Scenario Into Database</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadScenarioCsv}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white py-3 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download size={14} />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: CUSTOM CSV GATE LOG UPLOAD */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md mb-1">
                Custom Files
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Upload Custom Gate Log
              </h2>
            </div>
            <span className="text-xs text-slate-500">.CSV Only</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Upload an operational gate-log CSV from third-party weighbridge or ERP systems to run the full 12-step calculation engine against it.
          </p>

          {/* Upload Dropzone */}
          <label className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center transition-colors hover:border-rose-400 hover:bg-rose-50/30 cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              disabled={uploading}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-rose-600 shadow-sm group-hover:scale-105 transition-transform mb-3">
              <UploadCloud size={24} />
            </div>
            <p className="text-xs font-bold text-slate-800">
              {uploading ? "Ingesting gate logs..." : "Click or drag CSV file to upload"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Required: trip_id, truck_plate, carrier, gate_in, gate_out
            </p>
          </label>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">Automated Processing:</span>
            <p>
              Each row with a valid departure timestamp triggers free-time deduction, grace checks, and invoice calculation automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Financial & Compliance Exports Grid */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Statutory Reconciliations &amp; Exportable Datasets
            </h2>
            <p className="text-xs text-slate-500">
              Extract audited records for EPRA regulatory compliance, KRA customs, or SAP ERP reconciliation.
            </p>
          </div>
          <span className="self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            Export Center
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-5">
            <div>
              <FileSpreadsheet size={24} className="text-rose-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-900">Truck Movements Log</h3>
              <p className="mt-1 text-xs text-slate-500">
                Complete trip logs with arrival, weighbridge tare, loading dwell, and departure minutes.
              </p>
            </div>
            <button
              onClick={() => handleExport("/api/v1/exports/movements.csv", "kpc_truck_movements.csv")}
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-5">
            <div>
              <Receipt size={24} className="text-blue-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-900">Demurrage Invoices</h3>
              <p className="mt-1 text-xs text-slate-500">
                12-step billing records, approved invoice schedules, and SAP S/4HANA reference numbers.
              </p>
            </div>
            <Link
              href="/portal/billing"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ExternalLink size={13} />
              <span>View Invoices</span>
            </Link>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-5">
            <div>
              <Sparkles size={24} className="text-purple-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-900">Turnaround Outliers</h3>
              <p className="mt-1 text-xs text-slate-500">
                Statistical Z-score outliers, extreme delays, and carrier bottleneck analyses.
              </p>
            </div>
            <Link
              href="/portal/ai-intelligence"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ExternalLink size={13} />
              <span>Inspect Models</span>
            </Link>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-5">
            <div>
              <FileCheck size={24} className="text-emerald-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-900">Cryptographic Audit Logs</h3>
              <p className="mt-1 text-xs text-slate-500">
                Immutable SHA-256 event traces, user actions, and non-repudiation audit trails.
              </p>
            </div>
            <Link
              href="/portal/compliance"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ExternalLink size={13} />
              <span>Compliance Logs</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
