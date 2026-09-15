"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  ArrowRight,
  User,
  Mail,
  Lock,
  Sparkles,
  CheckCircle2,
  Info,
  Layers,
  ChevronRight,
  Users,
  Eye,
  Key,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { LoginResponse } from "@/lib/types";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";

const ROLES_GUIDE = [
  {
    role: "Admin",
    lead: "Brian Mugambi (admin)",
    badge: "Full Governance",
    color: "from-slate-800 to-slate-900",
    avatar: "/images/team/brian_mugambi.jpg",
    responsibilities: [
      "Terminal & depot infrastructure configuration",
      "TSA contract parameter management & tariff rates",
      "User clearance provisioning & role assignments",
      "Full cryptographic audit trail surveillance",
    ],
    clearance: "Level 1 – Executive System Authority",
    workflow: "Configures demurrage grace periods & rates -> Authorizes internal clearance -> Oversees platform integrity.",
    demoUser: "brian.mugambi",
  },
  {
    role: "Ops",
    lead: "Carson Sila",
    badge: "Terminal & SCADA",
    color: "from-emerald-600 to-teal-700",
    avatar: "/images/team/carson_sila.jpg",
    responsibilities: [
      "Live bay occupancy & weighbridge tare/gross monitoring",
      "RFID gate telemetry log inspection & discrepancy resolution",
      "ETL pipeline sync execution across 5 inland depots",
      "Real-time yard turnaround congestion mitigation",
    ],
    clearance: "Level 2 – Operational Yard Control",
    workflow: "Monitors gantry queues -> Verifies bay dwell times -> Triggers telemetry batch ETL -> Dispatches alerts.",
    demoUser: "carson.sila",
  },
  {
    role: "Billing Approver",
    lead: "Charlene Kamunyu",
    badge: "Revenue Assurance",
    color: "from-rose-600 to-rose-700",
    avatar: "/images/team/charlene_kamunyu.jpg",
    responsibilities: [
      "12-step TSA demurrage calculation verification",
      "Adjudication of OMC delay disputes with evidence review",
      "Formal invoice approval & signature before ERP transmission",
      "Resolution of revenue leakage alerts & rate discrepancies",
    ],
    clearance: "Level 2 – Financial Billing Authority",
    workflow: "Inspects calculated demurrage trips -> Reviews OMC dispute tickets -> Signs off finalized invoices.",
    demoUser: "charlene.kamunyu",
  },
  {
    role: "Finance",
    lead: "Emanuel Brian",
    badge: "AI & ERP Integration",
    color: "from-purple-600 to-indigo-700",
    avatar: "/images/team/emanuel_brian.jpg",
    responsibilities: [
      "Predictive AI turnaround & demurrage exposure forecasting",
      "Statistical Z-score outlier detection models",
      "Automated SAP S/4HANA invoice posting & GL reconciliation",
      "Quarterly revenue leakage mitigation reporting",
    ],
    clearance: "Level 2 – Fiscal & Data Intelligence",
    workflow: "Runs ML anomaly models -> Identifies bottleneck depots -> Pushes approved demurrage batches to SAP.",
    demoUser: "emanuel.brian",
  },
  {
    role: "Auditor",
    lead: "Brian Sigei",
    badge: "Compliance & Oversight",
    color: "from-amber-600 to-amber-700",
    avatar: "/images/team/brian_sigei.jpg",
    responsibilities: [
      "Non-repudiation audit log verification (SHA-256 integrity)",
      "EPRA certification & KRA ECTS cargo seal cross-checking",
      "Demurrage tariff calculation compliance checks",
      "Export of regulatory board reports & variance schedules",
    ],
    clearance: "Level 3 – Independent Compliance Inspection",
    workflow: "Audits calculation traces -> Verifies tamper-evident logs -> Exports statutory compliance reports.",
    demoUser: "brian.sigei",
  },
  {
    role: "OMC Representative",
    lead: "River Leah",
    badge: "Fleet Partner Portal",
    color: "from-blue-600 to-blue-700",
    avatar: "/images/team/river_leah.jpg",
    responsibilities: [
      "Real-time tracking of contracted fleet trucks inside KPC bays",
      "Verification of turnaround dwell minutes & free time buffer",
      "Submission of dispute tickets with depot outage evidence",
      "Self-service simulation using interactive demurrage calculator",
    ],
    clearance: "External Partner – Read & Dispute Access",
    workflow: "Tracks truck gate-in/out -> Inspects demurrage charges -> Submits documentation for unjustified delays.",
    demoUser: "river.leah",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(5); // Default OMC Rep
  const [form, setForm] = useState({
    fullName: "",
    organization: "",
    email: "",
    username: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeGuide = ROLES_GUIDE[selectedRoleIndex];

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Self-register with the backend
      await api.post<LoginResponse>(
        "/api/v1/auth/register",
        {
          username: form.username,
          full_name: form.fullName,
          email: form.email,
          password: form.password,
          organization: form.organization,
        },
        { auth: false }
      );
      // Automatically log in
      await login(form.username, form.password);
      setSuccess("Account registered successfully! Redirecting to command portal...");
      setTimeout(() => {
        router.push("/portal/dashboard");
      }, 1000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not complete account registration.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/kpc/kpc_logo_long.png"
              alt="Kenya Pipeline Company"
              width={160}
              height={36}
              className="h-8 w-auto"
              priority
            />
            <span className="hidden sm:inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Registration &amp; Role Guide
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Public Overview
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 transition-colors shadow-sm"
            >
              Sign In Instead
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 flex-1 w-full">
        {/* Title block */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 uppercase tracking-wider mb-3">
            <Sparkles size={13} />
            Enterprise Role Matrix &amp; Self-Registration
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Account Registration &amp; Role Architecture
          </h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Kenya Pipeline Company implements strict separation of duties across operational telemetry, tariff calculation, billing approvals, compliance audits, and partner carrier access.
          </p>
        </div>

        {/* Two-Column Layout: Role Guide Tabs (Left) + Registration Form (Right) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* LEFT 7 COLUMNS: INTERACTIVE ROLE GUIDE */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={18} className="text-rose-600" />
                  Select a Role to View Guide &amp; Permissions
                </h2>
                <span className="text-[11px] font-medium text-slate-500">6 Specialized Roles</span>
              </div>

              {/* Role selector pill grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
                {ROLES_GUIDE.map((r, idx) => {
                  const isSelected = selectedRoleIndex === idx;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setSelectedRoleIndex(idx)}
                      className={`flex items-center gap-2.5 rounded-2xl p-2.5 text-left transition-all border ${
                        isSelected
                          ? "border-rose-600 bg-rose-50/50 shadow-sm"
                          : "border-slate-200/80 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100/60"
                      }`}
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200">
                        <Image
                          src={r.avatar}
                          alt={r.lead}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isSelected ? "text-rose-700" : "text-slate-800"}`}>
                          {r.role}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{r.lead}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Role Detailed Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-white shadow-sm">
                      <Image
                        src={activeGuide.avatar}
                        alt={activeGuide.lead}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">{activeGuide.role}</h3>
                        <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          {activeGuide.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">Lead: <strong>{activeGuide.lead}</strong></p>
                    </div>
                  </div>

                  <Link
                    href={`/login?demo=${activeGuide.demoUser}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-white px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors shadow-sm"
                  >
                    <span>Instant Demo Login</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                {/* Responsibilities list */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Core Operational Responsibilities:
                  </h4>
                  <ul className="space-y-1.5">
                    {activeGuide.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                        <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Workflow & clearance info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 text-xs">
                  <div className="rounded-xl bg-white p-3 border border-slate-200/70">
                    <span className="block font-bold text-[10px] uppercase text-slate-400">Security Clearance</span>
                    <strong className="text-slate-800 font-semibold">{activeGuide.clearance}</strong>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-slate-200/70">
                    <span className="block font-bold text-[10px] uppercase text-slate-400">Sample Workflow</span>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{activeGuide.workflow}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Public inquiry link */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Have questions for the engineering team?</p>
                  <p className="text-[11px] text-slate-500">Contact Brian Mugambi, Emmanuel Brian, or any lead directly.</p>
                </div>
              </div>
              <Link
                href="/portal/about"
                className="shrink-0 rounded-full border border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Inquire &rarr;
              </Link>
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: REGISTRATION FORM */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 mb-2">
                Self-Service Portal Sign Up
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Register New Account
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Register an authorized OMC partner account or provision a staging operator profile.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Representative Full Name</label>
                <div className="relative mt-1">
                  <User size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    placeholder="e.g. David Kamau"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">
                  Organization / Oil Marketing Company
                </label>
                <div className="relative mt-1">
                  <Building2 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    value={form.organization}
                    onChange={(e) => update("organization", e.target.value)}
                    placeholder="e.g. TotalEnergies Kenya / Vivo / Rubis"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Corporate Email Address</label>
                <div className="relative mt-1">
                  <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="rep@company.co.ke"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Desired Username</label>
                  <div className="relative mt-1">
                    <User size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      value={form.username}
                      onChange={(e) => update("username", e.target.value)}
                      placeholder="e.g. david.kamau"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Password (Min 8 chars)</label>
                  <div className="relative mt-1">
                    <Lock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700 flex items-center gap-1">
                  <Info size={13} className="text-blue-600" /> Registration Security Policy
                </p>
                <p>
                  Accounts self-registered here receive immediate OMC Partner clearance. Internal KPC roles with billing approval or SAP posting authority are audited by Brian Mugambi (System Admin).
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 py-3 text-xs font-bold text-white shadow-sm hover:from-rose-700 hover:to-rose-800 transition-all disabled:opacity-50"
              >
                {loading ? "Registering & Authenticating..." : "Complete Registration & Enter Portal"}
                <ArrowRight size={14} />
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4 text-center">
              <p className="text-xs text-slate-600">
                Already registered or using a demo role?{" "}
                <Link
                  href="/login"
                  className="font-bold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  Sign in here &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Kenya Pipeline Company Limited &bull; Revenue Assurance Division
      </footer>
    </div>
  );
}
