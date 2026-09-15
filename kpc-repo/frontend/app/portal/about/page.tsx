"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Cpu,
  Receipt,
  Scale,
  Radio,
  Send,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Building2,
  ExternalLink,
  Code,
  X,
  Mail,
} from "lucide-react";
import { ExecutiveHero } from "@/components/executive-hero";

interface Developer {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  bio: string;
  badge: string;
  accent: string;
  specialties: string[];
  email: string;
}

const DEVELOPERS: Developer[] = [
  {
    id: "emanuel",
    name: "Emanuel Brian",
    role: "AI/ML & Data Intelligence Engineer",
    department: "Advanced Data Systems & Predictive Analytics",
    avatar: "/images/team/emanuel_brian.jpg",
    bio: "Architect of the Turnaround Anomaly Detector, statistical Z-score outlier analysis, and predictive demurrage risk forecasting models across KPC's 5 inland depots.",
    badge: "AI & ML Core",
    accent: "from-purple-600 to-indigo-600",
    specialties: ["Scikit-Learn Outlier Models", "Z-Score Analysis", "FastAPI Data Telemetry", "Statistical Forecasting"],
    email: "emanuel.brian@kpc.co.ke",
  },
  {
    id: "mugambi",
    name: "Brian Mugambi (admin)",
    role: "System Administrator & Lead Architect",
    department: "Enterprise Systems Governance & Architecture",
    avatar: "/images/team/brian_mugambi.jpg",
    bio: "Spearheaded the end-to-end platform design, role-based access control, cryptographic audit logging, and automated SAP S/4HANA financial integration.",
    badge: "System Admin & Arch",
    accent: "from-slate-800 to-slate-950",
    specialties: ["Platform Architecture", "RBAC Security", "TSA Tariff Rules Engine", "SAP S/4HANA ERP Sync"],
    email: "brian.mugambi@kpc.co.ke",
  },
  {
    id: "charlene",
    name: "Charlene Kamunyu",
    role: "Revenue Assurance & Billing Lead",
    department: "Finance & Commercial Audit Operations",
    avatar: "/images/team/charlene_kamunyu.jpg",
    bio: "Engineered the 12-Step TSA Demurrage Calculation engine, dispute adjudication protocol, and automated invoice verification for major Oil Marketing Companies.",
    badge: "Billing & Tariffs",
    accent: "from-rose-600 to-rose-700",
    specialties: ["12-Step Tariff Arithmetic", "Commercial TSA Contracts", "Dispute Adjudication", "Invoice Audit Trails"],
    email: "charlene.kamunyu@kpc.co.ke",
  },
  {
    id: "sigei",
    name: "Brian Sigei",
    role: "Compliance & Regulatory Auditor",
    department: "Regulatory Compliance & Risk Management",
    avatar: "/images/team/brian_sigei.jpg",
    bio: "Oversees statutory EPRA calibration standards, KRA ECTS electronic cargo seal integrity, and immutable cryptographic audit trails ensuring 100% auditable revenue.",
    badge: "Audit & EPRA / KRA",
    accent: "from-amber-600 to-amber-700",
    specialties: ["SHA-256 Non-Repudiation", "EPRA Compliance", "KRA ECTS Seals", "Statutory Reporting"],
    email: "brian.sigei@kpc.co.ke",
  },
  {
    id: "carson",
    name: "Carson Sila",
    role: "Operations & SCADA Telemetry Lead",
    department: "Pipeline & Terminal Field Operations",
    avatar: "/images/team/carson_sila.jpg",
    bio: "Manages real-time gantry loading sensors, RFID gate movements, weighbridge tare/gross synchronization, and the multi-stage ETL telemetry pipeline.",
    badge: "SCADA & Field Ops",
    accent: "from-emerald-600 to-teal-700",
    specialties: ["SCADA Gantry Sensors", "Weighbridge RFID Sync", "ETL Batch Ingestion", "Terminal GIS Telemetry"],
    email: "carson.sila@kpc.co.ke",
  },
  {
    id: "river",
    name: "River Leah",
    role: "OMC Commercial & Fleet Partner Lead",
    department: "Carrier Relations & Partner Integrations",
    avatar: "/images/team/river_leah.jpg",
    bio: "Leads the OMC Partner Portal experience, client fleet verification, self-service demurrage transparency, and commercial carrier onboarding.",
    badge: "OMC Fleet Portal",
    accent: "from-blue-600 to-cyan-600",
    specialties: ["Carrier Fleet Analytics", "OMC Partner Portals", "Self-Service Calculators", "Dispute Resolution"],
    email: "river.leah@vivoenergy.co.ke",
  },
];

export default function AboutPage() {
  const [selectedDev, setSelectedDev] = useState<Developer | null>(null);
  const [inquiryText, setInquiryText] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [inquiryCategory, setInquiryCategory] = useState("Technical Question");
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  function handleOpenInquiry(dev: Developer) {
    setSelectedDev(dev);
    setSubmittedTicket(null);
    setInquiryText("");
  }

  function handleSendInquiry(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      const ticketId = `INQ-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicket(ticketId);
      setSubmitting(false);
    }, 800);
  }

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <ExecutiveHero
        badgeText="ENGINEERING & REVENUE ARCHITECTURE TEAM"
        badgeType="live"
        title="Developers & System Architects"
        subtitle="Meet the core engineering team behind Kenya Pipeline Company's automated demurrage calculation engine, SCADA telemetry, and revenue assurance platform."
        imageSrc="/images/kpc/kpc_qualitycontrol_worker.png"
        imageAlt="KPC Engineering & Assurance Team"
        breadcrumbs={[
          { label: "Command Cockpit", href: "/portal/dashboard" },
          { label: "Developers & Team" },
        ]}
      />

      {/* Studiova-Style Stats Strip */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">1,700+ KM</p>
          <p className="text-xs font-semibold text-slate-700 mt-1">Pipeline Telemetry Governed</p>
          <p className="text-xs text-slate-500 mt-0.5">Continuous SCADA monitoring from Mombasa to Kisumu.</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">12 Steps</p>
          <p className="text-xs font-semibold text-slate-700 mt-1">Deterministic TSA Tariff Engine</p>
          <p className="text-xs text-slate-500 mt-0.5">Auditable down to individual seconds and shillings.</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-3xl font-extrabold text-rose-600 tracking-tight">6 Roles</p>
          <p className="text-xs font-semibold text-slate-700 mt-1">Specialized Separation of Duties</p>
          <p className="text-xs text-slate-500 mt-0.5">Admin, Ops, Billing, Finance, Auditor, and OMC Partners.</p>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              System Engineering &amp; Operations Leadership
            </h2>
            <p className="text-xs text-slate-500">
              Click &ldquo;Inquire&rdquo; on any developer profile to submit a system inquiry directly.
            </p>
          </div>
          <span className="self-start rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            Core Development Unit
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DEVELOPERS.map((dev) => (
            <div
              key={dev.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md hover:-translate-y-1"
            >
              <div>
                {/* Profile Header: Unique Circular Portrait + Punchy Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-slate-200/80 shadow-md group-hover:scale-105 transition-transform">
                    <Image
                      src={dev.avatar}
                      alt={dev.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <span className={`rounded-full bg-gradient-to-r ${dev.accent} px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm`}>
                    {dev.badge}
                  </span>
                </div>

                {/* Name & Role */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{dev.name}</h3>
                  <p className="text-xs font-semibold text-rose-600 mt-0.5">{dev.role}</p>
                  <p className="text-[11px] font-medium text-slate-400">{dev.department}</p>
                </div>

                {/* Bio */}
                <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-3">
                  {dev.bio}
                </p>

                {/* Specialties tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {dev.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Action: Inquire Button */}
              <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">{dev.email}</span>
                <button
                  type="button"
                  onClick={() => handleOpenInquiry(dev)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-600 transition-colors"
                >
                  <MessageSquare size={12} />
                  <span>Inquire</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Inquiry Modal */}
      {selectedDev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setSelectedDev(null)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>

            {submittedTicket ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Inquiry Dispatched!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your inquiry has been logged and routed directly to <strong>{selectedDev.name}</strong>.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono text-slate-700">
                  <span className="block text-slate-400 text-[10px] uppercase">Tracking Ticket Number</span>
                  <strong className="text-sm font-bold text-slate-900">{submittedTicket}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDev(null)}
                  className="rounded-full bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200">
                    <Image
                      src={selectedDev.avatar}
                      alt={selectedDev.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                      Direct System Inquiry
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{selectedDev.name}</h3>
                    <p className="text-xs text-slate-500">{selectedDev.role}</p>
                  </div>
                </div>

                <form onSubmit={handleSendInquiry} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700">Your Name</label>
                      <input
                        required
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="e.g. Operations Officer"
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Your Email</label>
                      <input
                        required
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="officer@kpc.co.ke"
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">Inquiry Domain / Category</label>
                    <select
                      value={inquiryCategory}
                      onChange={(e) => setInquiryCategory(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-rose-500 focus:outline-none"
                    >
                      <option>AI / Turnaround Model Optimization</option>
                      <option>12-Step Tariff Arithmetic & Contract Setup</option>
                      <option>SCADA Gantry Telemetry & RFID Ingestion</option>
                      <option>EPRA / KRA Compliance & Audit Trails</option>
                      <option>OMC Fleet Onboarding & Disputes</option>
                      <option>Platform Governance & Security Clearance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">Detailed Message / Question</label>
                    <textarea
                      required
                      rows={4}
                      value={inquiryText}
                      onChange={(e) => setInquiryText(e.target.value)}
                      placeholder={`Explain what you would like to inquire regarding ${selectedDev.department}...`}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !inquiryText}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 py-2.5 font-bold text-white shadow-sm hover:from-rose-700 hover:to-rose-800 transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>Transmitting Inquiry...</span>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Transmit Inquiry to {selectedDev.name.split(" ")[0]}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
