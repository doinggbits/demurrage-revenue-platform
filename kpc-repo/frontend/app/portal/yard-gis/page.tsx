"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Radio,
  Truck,
  Gauge,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Maximize2,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { ExecutiveHero } from "@/components/executive-hero";

interface Depot {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  active_bays: number;
  baseline_turnaround_mins: number;
}

const TERMINAL_IMAGES: Record<string, { image: string; description: string; type: string }> = {
  "DEP-KPC-MBO": {
    image: "/images/kpc/kpc_industry1.png",
    description: "Kipevu Oil Storage Facility (KOSF). Handles 100% of Kenya's refined maritime petroleum imports.",
    type: "Marine Super-Terminal",
  },
  "DEP-KPC-NBI": {
    image: "/images/kpc/kpc_nairobi_headoffice.png",
    description: "Industrial Area Terminal & Kenpipe Plaza. Main inland redistribution hub for the Nairobi metropolitan market.",
    type: "Primary Inland Hub",
  },
  "DEP-KPC-NAK": {
    image: "/images/kpc/kpc_nakuru_office.png",
    description: "Rift Valley loading depot serving central agriculture, commercial transport, and energy corridors.",
    type: "Regional Pipeline Depot",
  },
  "DEP-KPC-ELD": {
    image: "/images/kpc/kpc_parked_truck_birdview.png",
    description: "North-Rift dispatch terminal and strategic transit hub for Great Lakes export cargo into Uganda.",
    type: "Transit Export Gateway",
  },
  "DEP-KPC-KIS": {
    image: "/images/kpc/kpc_petroltruck1.png",
    description: "Lake Victoria oil jetty supplying waterborne fuel barges to Uganda, Rwanda, Burundi, and eastern DRC.",
    type: "Lake Terminal & Jetty",
  },
};

// Rough Kenya bounding box for projection
const BOUNDS = { minLat: -4.9, maxLat: 4.7, minLon: 33.7, maxLon: 42.0 };
const VIEW_W = 720;
const VIEW_H = 640;

function project(lat: number, lon: number) {
  const x = ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * VIEW_W;
  const y = VIEW_H - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * VIEW_H;
  return { x, y };
}

export default function YardGisPage() {
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selected, setSelected] = useState<Depot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: Depot[] }>("/api/v1/depots")
      .then((r) => {
        setDepots(r.data);
        setSelected(r.data[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedMeta = selected
    ? TERMINAL_IMAGES[selected.id] ?? {
        image: "/images/kpc/kpc_industry2.png",
        description: "High-capacity automated loading depot.",
        type: "Active Loading Depot",
      }
    : null;

  return (
    <div className="space-y-8">
      {/* Executive Photographic Hero Banner */}
      <ExecutiveHero
        badgeText="NATIONAL PIPELINE SCADA & GIS RADAR"
        badgeType="live"
        title="Yard GIS & Telemetry Command"
        subtitle="Live tracking of gantry bay capacity, truck turnaround dwell times, and line flow across Kenya's 1,700km pipeline network."
        imageSrc="/images/kpc/kpc_parked_truck_birdview.png"
        imageAlt="Aerial View of KPC Gantry Loading Yard"
        breadcrumbs={[
          { label: "Command Cockpit", href: "/portal/dashboard" },
          { label: "Yard GIS & Terminals" },
        ]}
        actions={
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-bold text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              5/5 TERMINALS STREAMING SCADA
            </span>
          </div>
        }
      />

      {/* Terminal network snapshot — punched cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Terminals online", value: "5 / 5", grad: "from-[#E30613] via-[#F43F5E] to-[#FB7185]" },
          { label: "Active gantry bays", value: "24 / 26", grad: "from-[#7C3AED] via-[#A855F7] to-[#C084FC]" },
          { label: "Line 5 flow", value: "1,120 m³/h", grad: "from-[#1D4ED8] via-[#3B82F6] to-[#60A5FA]" },
          { label: "SCADA status", value: "Verified", grad: "from-[#0F172A] via-[#1E293B] to-[#334155]" },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl bg-gradient-to-br ${k.grad} px-4 py-4 text-white shadow-lg`}
          >
            <p className="text-lg sm:text-xl font-extrabold tracking-tight">{k.value}</p>
            <p className="mt-0.5 text-[11px] text-white/90 font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Interactive GIS Command Radar Map */}
        <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 lg:col-span-7">
          {/* Radar Header */}
          <div className="flex items-center justify-between border-b border-kpc-border pb-4">
            <div className="flex items-center gap-2.5">
              <Radio size={18} className="text-kpc-red animate-pulse" />
              <div>
                <h2 className="text-base font-bold text-kpc-text">Pipeline Geographic Radar</h2>
                <p className="text-xs text-kpc-text-3">Line 1, 4 &amp; 5 Inland Fuel Corridors</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-sky-600">PULSE: 1.2s</span>
            </div>
          </div>

          {/* SVG Map Canvas with futuristic dark grid & animated fuel flow */}
          <div className="relative my-4 flex aspect-[72/64] w-full items-center justify-center overflow-hidden rounded-2xl border border-kpc-border bg-[#07090E]">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:32px_32px]" />

            {/* Radar Concentric Circles */}
            <div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full border border-white/[0.04]" />
            <div className="pointer-events-none absolute h-[320px] w-[320px] rounded-full border border-white/[0.05]" />
            <div className="pointer-events-none absolute h-[160px] w-[160px] rounded-full border border-cyan-500/10" />

            {loading ? (
              <div className="flex items-center gap-3 text-sm text-kpc-text-3">
                <Radio className="animate-spin text-kpc-red" size={20} />
                <span>Synchronizing orbital coordinates…</span>
              </div>
            ) : (
              <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="relative z-10 h-full w-full">
                <defs>
                  <linearGradient id="pipelineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="50%" stopColor="#E30613" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Animated Primary Pipeline Fuel Flow Path */}
                {depots.length > 0 && (
                  <>
                    {/* Base Pipeline Track */}
                    <polyline
                      points={["DEP-KPC-MBO", "DEP-KPC-NBI", "DEP-KPC-NAK", "DEP-KPC-ELD", "DEP-KPC-KIS"]
                        .map((id) => depots.find((d) => d.id === id))
                        .filter((d): d is Depot => !!d)
                        .map((d) => {
                          const p = project(d.latitude, d.longitude);
                          return `${p.x},${p.y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#1F2937"
                      strokeWidth={6}
                      strokeLinecap="round"
                    />

                    {/* Animated Pulsing Fuel Stream */}
                    <polyline
                      points={["DEP-KPC-MBO", "DEP-KPC-NBI", "DEP-KPC-NAK", "DEP-KPC-ELD", "DEP-KPC-KIS"]
                        .map((id) => depots.find((d) => d.id === id))
                        .filter((d): d is Depot => !!d)
                        .map((d) => {
                          const p = project(d.latitude, d.longitude);
                          return `${p.x},${p.y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="url(#pipelineGradient)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      className="animate-pipeline"
                      filter="url(#glow)"
                    />
                  </>
                )}

                {/* Terminal Nodes */}
                {depots.map((d) => {
                  const p = project(d.latitude, d.longitude);
                  const isSelected = selected?.id === d.id;
                  const util = d.active_bays / d.capacity;
                  const color = util > 0.12 ? "#E30613" : "#10B981";

                  return (
                    <g
                      key={d.id}
                      onClick={() => setSelected(d)}
                      className="cursor-pointer transition-transform duration-200 hover:scale-125"
                    >
                      {/* Pulse Ring for Selected Terminal */}
                      {isSelected && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={28}
                          fill="none"
                          stroke={color}
                          strokeWidth={1.5}
                          className="animate-ping opacity-40"
                        />
                      )}

                      {/* Halo ring */}
                      <circle cx={p.x} cy={p.y} r={isSelected ? 18 : 12} fill={color} opacity={0.25} />
                      {/* Core beacon */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isSelected ? 8 : 6}
                        fill={isSelected ? "#FFFFFF" : color}
                        stroke={color}
                        strokeWidth={2}
                      />

                      {/* Terminal Label Tag */}
                      <rect
                        x={p.x + 14}
                        y={p.y - 12}
                        width={90}
                        height={24}
                        rx={6}
                        fill="#0F172A"
                        fillOpacity={0.85}
                        stroke={isSelected ? color : "rgba(255,255,255,0.1)"}
                        strokeWidth={1}
                      />
                      <text
                        x={p.x + 22}
                        y={p.y + 4}
                        fill="#FFFFFF"
                        fontSize={11}
                        fontWeight={700}
                        fontFamily="Inter, sans-serif"
                      >
                        {d.code}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Map Status Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-kpc-text-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Normal Utilization (&lt;85%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-kpc-red" />
                Congestion Warning (&gt;85%)
              </span>
            </div>
            <span className="font-mono text-[11px] text-kpc-text-4">MOMBASA &rarr; NAIROBI &rarr; WESTERN LINE</span>
          </div>
        </div>

        {/* Selected Terminal Inspector Panel with Photography */}
        <div className="space-y-4 lg:col-span-5">
          {selected && selectedMeta && (
            <div className="glass-panel overflow-hidden rounded-2xl border border-kpc-border p-6 shadow-sm">
              {/* Terminal Photo Header */}
              <div className="relative -mx-6 -mt-6 mb-5 h-48 overflow-hidden">
                <Image
                  src={selectedMeta.image}
                  alt={selected.name}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                  <div>
                    <span className="rounded-md border border-kpc-red/40 bg-kpc-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {selectedMeta.type}
                    </span>
                    <h3 className="mt-1 text-xl sm:text-2xl font-black text-white drop-shadow-md">
                      {selected.name}
                    </h3>
                  </div>
                  <span className="font-mono text-sm font-bold text-sky-300 bg-black/70 px-2.5 py-1 rounded-lg border border-white/20">
                    {selected.code}
                  </span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-kpc-text-2">
                {selectedMeta.description}
              </p>

              {/* Terminal Telemetry Meters */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-kpc-border bg-kpc-bg p-4">
                  <div className="flex items-center gap-2 text-kpc-text-3">
                    <Truck size={15} className="text-sky-600" />
                    <span className="text-[11px] font-semibold uppercase">Active Bays</span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-kpc-text">
                    {selected.active_bays}{" "}
                    <span className="text-xs font-normal text-kpc-text-3">/ {selected.capacity} bays</span>
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-cyan-400"
                      style={{ width: `${(selected.active_bays / selected.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-kpc-border bg-kpc-bg p-4">
                  <div className="flex items-center gap-2 text-kpc-text-3">
                    <Clock size={15} className="text-amber-400" />
                    <span className="text-[11px] font-semibold uppercase">Baseline Turnaround</span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-amber-500">
                    {selected.baseline_turnaround_mins}{" "}
                    <span className="text-xs font-normal text-kpc-text-3">mins</span>
                  </p>
                  <p className="mt-2 text-[10px] text-kpc-text-3">Contractual demurrage threshold</p>
                </div>
              </div>

              {/* Action Trigger */}
              <div className="mt-6 flex items-center justify-between border-t border-kpc-border pt-4">
                <div className="text-xs">
                  <span className="text-kpc-text-3">Terminal Gate Dwell: </span>
                  <span className="font-bold text-emerald-600">Optimal (1h 48m)</span>
                </div>
                <Link
                  href={`/portal/movements?depot_id=${selected.id}`}
                  className="btn-pill flex items-center gap-2 bg-kpc-red px-5 py-2 text-xs font-bold text-white shadow-lg shadow-kpc-red/30 transition-all hover:bg-kpc-red-hover hover:scale-105"
                >
                  <span>Inspect Yard Trucks</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* Quick Depot Selector Pill Grid */}
          <div className="space-y-2">
            <p className="px-2 text-xs font-bold uppercase tracking-wider text-kpc-text-3">
              Terminal Quick Switcher
            </p>
            {depots.map((d) => {
              const isSelected = selected?.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-kpc-red bg-rose-50/70 shadow-md shadow-rose-500/10"
                      : "border-kpc-border bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-mono font-bold ${
                        isSelected
                          ? "border-kpc-red bg-kpc-red text-white"
                          : "border-kpc-border bg-kpc-bg text-kpc-text-3"
                      }`}
                    >
                      {d.code.slice(0, 3)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-kpc-text">{d.name}</p>
                      <p className="text-[11px] text-kpc-text-3">
                        {d.active_bays} active bays &bull; {d.baseline_turnaround_mins}m target
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      isSelected ? "bg-kpc-red text-white" : "bg-kpc-bg text-kpc-text-3"
                    }`}
                  >
                    SELECT
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
