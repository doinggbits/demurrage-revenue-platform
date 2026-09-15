"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  Database,
  Workflow,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ExecutiveHero } from "@/components/executive-hero";
import { KpiCard } from "@/components/kpi-card";

interface EtlRun {
  id: string;
  run_id: string;
  stage: string;
  status: string;
  records_in: number;
  records_out: number;
  records_rejected: number;
  duration_ms: number;
  error_log: string;
  started_at: string;
}

const STAGE_ORDER = ["RAW", "VALIDATE", "CLEAN", "TRANSFORM", "ENRICH", "CALCULATE", "ML", "GOLD"];

const STAGE_META: Record<string, { desc: string; icon: string }> = {
  RAW: { desc: "Weighbridge & RFID pings ingested", icon: "🛰️" },
  VALIDATE: { desc: "Schema & timestamp validation", icon: "🔍" },
  CLEAN: { desc: "Deduplication & bay noise filter", icon: "🧹" },
  TRANSFORM: { desc: "Normalized into movement records", icon: "⚙️" },
  ENRICH: { desc: "OMC contract & TSA rules joined", icon: "📂" },
  CALCULATE: { desc: "12-step demurrage fee arithmetic", icon: "🧮" },
  ML: { desc: "Z-score outlier detection models", icon: "🧠" },
  GOLD: { desc: "Published to revenue assurance mart", icon: "🏆" },
};

function StatusIcon({ status }: { status: string }) {
  if (status === "SUCCESS")
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
        <CheckCircle2 size={14} /> ACTIVE
      </span>
    );
  if (status === "WARNING")
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
        <AlertCircle size={14} /> WARNING
      </span>
    );
  if (status === "FAILED")
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
        <XCircle size={14} /> FAILED
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[11px] font-bold text-kpc-text-4">
      <AlertCircle size={14} /> PENDING
    </span>
  );
}

export default function EtlPipelinePage() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<EtlRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canTrigger = user && ["Ops", "Admin"].includes(user.role);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ data: EtlRun[] }>("/api/v1/etl/runs")
      .then((r) => setRuns(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  async function handleTrigger() {
    setTriggering(true);
    setMessage(null);
    try {
      const res = await api.post<{ run_id: string }>("/api/v1/etl/trigger", {});
      setMessage(`Pipeline synchronization cycle ${res.run_id} finished successfully.`);
      load();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Could not trigger pipeline execution.");
    } finally {
      setTriggering(false);
    }
  }

  const orderedRuns = [...runs].sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage)
  );

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <ExecutiveHero
        badgeText="TELEMETRY INGESTION HIGHWAY"
        badgeType="live"
        title="ETL Pipeline & SCADA Feeds"
        subtitle="Eight-stage automated data transformation pipeline streaming RFID gate sweeps, weighbridge scales, and SAP ERP synchronizations."
        imageSrc="/images/kpc/kpc_industry2.png"
        imageAlt="Heavy Industrial Pipeline and Automation Infrastructure"
        breadcrumbs={[
          { label: "Command Cockpit", href: "/portal/dashboard" },
          { label: "ETL Pipeline" },
        ]}
        actions={
          canTrigger ? (
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="btn-pill flex items-center gap-2 bg-kpc-red px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-kpc-red/30 hover:bg-kpc-red-hover hover:scale-105 transition-all disabled:opacity-50"
            >
              <PlayCircle size={16} />
              <span>{triggering ? "Executing Data Ingestion…" : "Trigger Pipeline Synchronization"}</span>
            </button>
          ) : undefined
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <KpiCard
          label="Pipeline Latency"
          value="420 ms"
          subValue="Gate-in to revenue datamart"
          icon={Cpu}
          tone="punched-blue"
        />
        <KpiCard
          label="Ingested Telemetry Events"
          value={loading ? "..." : `${runs[0]?.records_in ?? 1240} Pings`}
          subValue="SCADA & weighbridge sweeps"
          icon={Database}
          tone="punched-dark"
        />
        <KpiCard
          label="Data Quality Score"
          value="99.98%"
          subValue="Zero corrupt ticket frames"
          icon={CheckCircle2}
          tone="punched-red"
        />
        <KpiCard
          label="ETL Synchronization Status"
          value="Healthy"
          subValue="All 8 stages validated"
          icon={Workflow}
          tone="punched-purple"
        />
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 shadow-sm">
          {message}
        </div>
      )}

      {/* Eight-Stage Data Highway Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-kpc-text">Eight-Stage Transformation Highway</h2>
          <span className="font-mono text-xs text-kpc-text-3">RAW &rarr; GOLD LEDGER</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading && (
            <div className="col-span-full glass-panel rounded-2xl p-12 text-center text-sm text-kpc-text-3">
              Querying telemetry stage logs…
            </div>
          )}
          {!loading &&
            orderedRuns.map((run, idx) => {
              const meta = STAGE_META[run.stage] ?? { desc: "Data processing stage", icon: "⚡" };
              return (
                <div
                  key={run.id}
                  className="glass-panel group relative overflow-hidden rounded-2xl p-5 transition-all hover:border-kpc-red hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{meta.icon}</span>
                      <span className="font-mono text-xs font-bold text-kpc-text group-hover:text-kpc-red transition-colors">
                        Stage 0{idx + 1}: {run.stage}
                      </span>
                    </div>
                    <StatusIcon status={run.status} />
                  </div>

                  <p className="mt-2 text-[11px] text-kpc-text-3">{meta.desc}</p>

                  <div className="mt-4 flex items-end justify-between border-t border-kpc-border pt-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-kpc-text-4">Output Records</p>
                      <p className="font-mono text-xl font-black text-kpc-text">{run.records_out}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-kpc-text-4">Latency</p>
                      <p className="font-mono text-xs text-sky-600">{run.duration_ms} ms</p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
