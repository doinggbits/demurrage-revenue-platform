"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Calculator,
  Building2,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Receipt,
  FileCheck,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Radio,
  ExternalLink,
  MapPin,
  Clock,
  Layers,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DemurrageCalculator } from "@/components/demurrage-calculator";

const TERMINALS = [
  {
    code: "KOSF-PS01",
    name: "Kipevu Oil Storage Facility (Mombasa)",
    role: "Primary Marine Import Gateway",
    span: "Line 1 & Line 5 Intake",
    throughput: "1,120 m³/h",
    capacity: "326,000 m³ Tankage",
    note: "Where maritime supertankers berth and discharge petroleum products into the national pipeline trunk line.",
  },
  {
    code: "NBI-PS10",
    name: "Nairobi Terminal (Embakasi Depot)",
    role: "National Inland Hub",
    span: "Line 4 & Line 5 Terminus",
    throughput: "950 m³/h",
    capacity: "140,000 m³ Tankage",
    note: "The central industrial depot supplying the Nairobi Metropolitan area, aviation Jet A-1 to JKIA, and central Kenya.",
  },
  {
    code: "NAK-PS25",
    name: "Nakuru Depot",
    role: "Rift Valley Distribution Point",
    span: "Line 6 Pipeline Branch",
    throughput: "450 m³/h",
    capacity: "30,000 m³ Tankage",
    note: "Serves agricultural and commercial transport networks across the central Rift Valley and Mau summit corridor.",
  },
  {
    code: "ELD-PS27",
    name: "Eldoret Depot",
    role: "Western & Transit Gateway",
    span: "Northern Transit Corridor",
    throughput: "600 m³/h",
    capacity: "48,000 m³ Tankage",
    note: "High-volume loading depot servicing Western Kenya and transit tankers bound for Uganda, South Sudan, and DRC.",
  },
  {
    code: "KIS-PS28",
    name: "Kisumu Lake Jetty & Depot",
    role: "Lake Victoria Maritime Export",
    span: "Lake Jetty Marine Manifold",
    throughput: "500 m³/h",
    capacity: "45,000 m³ Tankage",
    note: "Direct pipeline discharge into lake barges crossing Lake Victoria to Port Bell, Jinja, and Bukoba.",
  },
];

const FORMULA_STEPS = [
  { num: "01", title: "Weighbridge In & RFID Ping", desc: "Truck arrives at gate, tare weight is recorded, and RFID tag is registered with SCADA." },
  { num: "02", title: "Gantry Bay Geofence Entry", desc: "Truck enters the assigned loading bay; geofence sensor triggers the active loading clock." },
  { num: "03", title: "Metered Arm Petroleum Flow", desc: "Calibrated flow meters inject product while temperature, density, and volume are logged." },
  { num: "04", title: "Gross Weight & Dip Verification", desc: "Truck leaves bay, re-weighs at gross weighbridge, and EPRA quality marker dip test runs." },
  { num: "05", title: "Dwell Timestamping", desc: "Total Turnaround Time (mins) = Gate-Out timestamp minus Gate-In timestamp." },
  { num: "06", title: "Contract Free-Time Deduction", desc: "Subtracted from dwell time (typically 120 minutes as defined in OMC's signed TSA contract)." },
  { num: "07", title: "Grace Period Check (15 mins)", desc: "If delay <= 15 minutes past free time, no fee is charged (grace buffer absorbs minor delays)." },
  { num: "08", title: "Grace Cliff Assessment", desc: "If turnaround exceeds free time + grace buffer, the grace period is revoked retroactively." },
  { num: "09", title: "Billable Unit Rounding", desc: "Net minutes rounded up according to commercial terms (e.g. 15-minute or 60-minute blocks)." },
  { num: "10", title: "Hourly Tariff Multiplier", desc: "Billable hours multiplied by contract rate (e.g. KES 3,500/hour or USD equivalent)." },
  { num: "11", title: "Weekend / Holiday Factor", desc: "Multipliers (1.2x on weekends, 1.5x on gazetted public holidays) applied automatically." },
  { num: "12", title: "Tax & Invoice Posting", desc: "16% VAT added; immutable invoice generated and queued for direct SAP S/4HANA sync." },
];

const TEAM_PREVIEWS = [
  { name: "Emanuel Brian", role: "AI & ML Intelligence Lead", avatar: "/images/team/emanuel_brian.jpg", tag: "AI Outlier Engine" },
  { name: "Brian Mugambi (admin)", role: "System Administrator & Architect", avatar: "/images/team/brian_mugambi.jpg", tag: "Platform Arch" },
  { name: "Charlene Kamunyu", role: "Revenue Assurance & Billing Lead", avatar: "/images/team/charlene_kamunyu.jpg", tag: "12-Step Billing" },
  { name: "Brian Sigei", role: "Compliance & Regulatory Auditor", avatar: "/images/team/brian_sigei.jpg", tag: "EPRA / KRA Audit" },
  { name: "Carson Sila", role: "Operations & SCADA Telemetry Lead", avatar: "/images/team/carson_sila.jpg", tag: "SCADA Gantry" },
  { name: "River Leah", role: "OMC Commercial Fleet Lead", avatar: "/images/team/river_leah.jpg", tag: "Fleet Portal" },
];

const FAQS = [
  {
    q: "What is demurrage, and why is it essential for KPC operations?",
    a: "Demurrage is the tariff fee assessed when an Oil Marketing Company (OMC) tanker occupies a KPC gantry bay longer than their contracted free time. Because KPC gantries supply national and regional fuel security, a tanker stalling at a loading bay creates immediate upstream queue congestion for all other carriers. Demurrage enforces discipline, maximizes bay turnaround, and protects public throughput.",
  },
  {
    q: "How is the 12-Step calculation deterministic and auditable?",
    a: "Unlike manual logbooks where arrival and departure times could be disputed, our platform ingests immutable timestamps directly from weighbridge RFID readers and SCADA gantry flow meters. Every calculation step - from free time deduction and grace cliffs to weekend multipliers and VAT - produces a complete JSON audit trace linked to a SHA-256 cryptographic fingerprint.",
  },
  {
    q: "What happens if a delay was caused by KPC depot equipment failures?",
    a: "If a tanker's delay was caused by a KPC pump failure, electrical trip, or weighbridge recalibration, the OMC can raise a dispute ticket in the OMC portal attaching depot logs. Billing Approver (Charlene Kamunyu) reviews the automated depot downtime record and can waive or adjust the charge before invoice issuance.",
  },
  {
    q: "How do the different user roles operate on the platform?",
    a: "The system enforces role separation: Carson Sila (Ops) monitors live bay movements; Charlene Kamunyu (Billing Approver) verifies arithmetic and disputes; Emanuel Brian (Finance & AI) oversees predictive risk models and SAP ERP sync; Brian Sigei (Auditor) verifies EPRA/KRA compliance trails; Brian Mugambi (Admin) governs system security; and River Leah / OMC Reps access their specific fleet dashboards.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-800 flex flex-col selection:bg-rose-500 selection:text-white">
      <SiteHeader />

      <main className="flex-1">
        {/* ============================================================
            HERO SECTION: Crisp White with Vibrant Berry Accents
            ============================================================ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-white to-white pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-bold text-rose-600 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
                </span>
                <span>KENYA PIPELINE COMPANY &bull; REVENUE ASSURANCE PLATFORM</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
                Every Gantry Minute, <br />
                <span className="bg-gradient-to-r from-[#E30613] via-[#F43F5E] to-[#7C3AED] bg-clip-text text-transparent">
                  Deterministically Reconciled.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Transforming SCADA weighbridge telemetry and RFID gate logs into verified, dispute-free demurrage invoices across Mombasa, Nairobi, Nakuru, Eldoret, and Kisumu.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Link
                  href="/login"
                  className="rounded-full bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition-all hover:brightness-110 hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span>Sign In to Portal</span>
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400"
                >
                  Sign Up &amp; Role Guide
                </Link>
                <a
                  href="#calculator"
                  className="rounded-full bg-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Interactive Calculator
                </a>
              </div>
            </div>

            {/* Punched Berry KPI Strip on White */}
            <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#C084FC] p-6 text-white shadow-xl shadow-purple-500/20 transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between opacity-90">
                  <span className="text-xs font-semibold uppercase tracking-wider">Revenue Protected</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">Q3 YTD</span>
                </div>
                <p className="mt-3 text-3xl font-black tracking-tight">KES 18.7M</p>
                <p className="mt-1 text-xs text-purple-100 font-medium">&uarr; 14.2% vs previous quarter</p>
              </div>

              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#60A5FA] p-6 text-white shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between opacity-90">
                  <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Span</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">Active</span>
                </div>
                <p className="mt-3 text-3xl font-black tracking-tight">1,700+ KM</p>
                <p className="mt-1 text-xs text-blue-100 font-medium">Mombasa to Lake Victoria jetty</p>
              </div>

              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0891B2] via-[#06B6D4] to-[#38BDF8] p-6 text-white shadow-xl shadow-cyan-500/20 transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between opacity-90">
                  <span className="text-xs font-semibold uppercase tracking-wider">Inland Terminals</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">100% Up</span>
                </div>
                <p className="mt-3 text-3xl font-black tracking-tight">5 of 5 Live</p>
                <p className="mt-1 text-xs text-cyan-100 font-medium">Automated RFID &amp; Tare logs</p>
              </div>

              <div className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 text-slate-900 shadow-md shadow-slate-200/40 transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">Audit SLA</span>
                  <span className="rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                    Zero Error
                  </span>
                </div>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">100% Trace</p>
                <p className="mt-1 text-xs text-slate-500 font-medium">Cryptographic SHA-256 logs</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 2: 12-STEP TSA DEMURRAGE CALCULATION FORMULA
            ============================================================ */}
        <section id="formula" className="py-20 bg-[#F8FAFC] border-y border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider shadow-sm mb-3">
                <Scale size={13} className="text-rose-600" />
                Deterministic Arithmetic Engine
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                The 12-Step TSA Demurrage Formula
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                KPC replaces manual estimates with an exact mathematical specification based on Transport and Storage Agreements (TSAs).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FORMULA_STEPS.map((s) => (
                <div
                  key={s.num}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-mono text-xs font-bold">
                      {s.num}
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      Step {s.num}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 3: INTERACTIVE DEMURRAGE CALCULATOR WIDGET
            ============================================================ */}
        <section id="calculator" className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 uppercase tracking-wider mb-3">
                <Calculator size={13} />
                Live Simulation Sandbox
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Test the Demurrage Calculation Live
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Adjust turnaround time, free time buffer, and contract parameters to see how the 12-step calculation engine evaluates demurrage liability in real time.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-[#F8FAFC] p-6 sm:p-10 shadow-sm max-w-4xl mx-auto">
              <DemurrageCalculator />
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 4: PIPELINE INFRASTRUCTURE NETWORK
            ============================================================ */}
        <section id="network" className="py-20 bg-[#F8FAFC] border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider shadow-sm mb-3">
                <Building2 size={13} className="text-rose-600" />
                Strategic Petroleum Terminals
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                National Gantry &amp; Pipeline Network
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                1,700 kilometers of high-pressure pipeline linking Mombasa maritime berths to inland commercial centers and Great Lakes transit borders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TERMINALS.map((t) => (
                <div
                  key={t.code}
                  className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between transition-all hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-md bg-rose-50 border border-rose-100 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-600">
                        {t.code}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Depot
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{t.role}</p>
                    <p className="mt-3 text-xs text-slate-600 leading-relaxed">{t.note}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                      <span className="block text-[10px] text-slate-400 font-sans">Throughput</span>
                      <strong className="text-slate-800">{t.throughput}</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                      <span className="block text-[10px] text-slate-400 font-sans">Storage</span>
                      <strong className="text-slate-800">{t.capacity}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 5: MEET OUR DEVELOPERS & SYSTEM ARCHITECTS
            ============================================================ */}
        <section id="developers" className="py-20 bg-white border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 uppercase tracking-wider mb-3">
                  <Users size={13} />
                  Development &amp; Architecture Unit
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  Meet the System Architects
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  The team that built KPC&apos;s revenue assurance algorithms, SCADA telemetry, and automated audit trails.
                </p>
              </div>
              <Link
                href="/about"
                className="self-start rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
              >
                View Full Team &amp; Inquire &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {TEAM_PREVIEWS.map((dev) => (
                <Link
                  key={dev.name}
                  href="/about"
                  className="group flex flex-col items-center text-center rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md hover:-translate-y-1"
                >
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-full border-2 border-slate-200 shadow-sm group-hover:scale-105 transition-transform mb-3">
                    <Image
                      src={dev.avatar}
                      alt={dev.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{dev.name}</h3>
                  <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">{dev.role}</p>
                  <span className="mt-2 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                    {dev.tag}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 6: FREQUENTLY ASKED QUESTIONS
            ============================================================ */}
        <section id="faq" className="py-20 bg-[#F8FAFC] border-t border-slate-200/80">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider shadow-sm mb-3">
                Clear Answers
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Understand how Kenya Pipeline Company reconciles demurrage, audits turnaround, and enforces billing integrity.
              </p>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp size={16} className="text-slate-400 shrink-0 ml-3" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400 shrink-0 ml-3" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
