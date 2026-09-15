"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  User,
  ChevronDown,
  Building2,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { useAuth, ApiError } from "@/lib/auth-context";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      router.push("/portal/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Authentication failed. Verify credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickLogin(u: string, p: string) {
    setError(null);
    setLoading(true);
    try {
      await login(u, p);
      router.push("/portal/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in with demo account.");
    } finally {
      setLoading(false);
    }
  }

  const selectedAccount = DEMO_ACCOUNTS[selectedDemoIndex];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between">
      {/* Top clean navigation ribbon */}
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
              Revenue Assurance
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
              href="/signup"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition-colors shadow-sm"
            >
              Sign Up &amp; Role Guide
            </Link>
          </div>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Left Column: Visual Executive Showcase */}
          <div className="relative hidden flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-10 shadow-sm lg:col-span-7 lg:flex">
            <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-slate-100">
              <Image
                src="/images/kpc/kpc_industry3.png"
                alt="KPC Terminal Operations"
                fill
                priority
                sizes="50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    SCADA GATE TELEMETRY ACTIVE
                  </span>
                  <p className="mt-1 font-mono text-xs font-medium text-slate-200">
                    5 Inland Terminals &bull; 1,700+ KM Pipeline Corridor
                  </p>
                </div>
                <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-[10px] font-bold backdrop-blur-md">
                  12-STEP TSA ENGINE
                </span>
              </div>
            </div>

            <div className="my-6 space-y-3">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                National Petroleum Demurrage &amp; Revenue Assurance.
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                Deterministic tariff calculation, geofenced weighbridge verification, and automated SAP S/4HANA invoice posting.
              </p>
            </div>

            {/* Punched KPI strip */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
              <div className="rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#3B82F6] p-3 text-white shadow-sm">
                <span className="block text-[10px] font-medium text-blue-100 uppercase">Protected Q3</span>
                <strong className="text-base font-extrabold tracking-tight">KES 18.7M</strong>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] p-3 text-white shadow-sm">
                <span className="block text-[10px] font-medium text-purple-100 uppercase">Turnaround SLA</span>
                <strong className="text-base font-extrabold tracking-tight">100% Audit</strong>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[#0891B2] to-[#06B6D4] p-3 text-white shadow-sm">
                <span className="block text-[10px] font-medium text-cyan-100 uppercase">Terminals</span>
                <strong className="text-base font-extrabold tracking-tight">5 of 5 Live</strong>
              </div>
            </div>
          </div>

          {/* Right Column: Clean White Login Card */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm lg:col-span-5 sm:p-10">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Sign In to Portal
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Select a demo account or sign in with your credentials.
                  </p>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <ShieldCheck size={20} />
                </div>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
                  {error}
                </div>
              )}

              {/* DEMO ACCOUNTS DROPDOWN SELECTOR (Requested) */}
              <div className="mb-6 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Sparkles size={13} className="text-rose-600" />
                    Demo Role Dropdown
                  </label>
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-md px-1.5 py-0.5">
                    1-Click Access
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={selectedDemoIndex}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setSelectedDemoIndex(idx);
                      setUsername(DEMO_ACCOUNTS[idx].username);
                      setPassword(DEMO_ACCOUNTS[idx].password);
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-xs font-semibold text-slate-800 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                  >
                    {DEMO_ACCOUNTS.map((acc, idx) => (
                      <option key={acc.username} value={idx}>
                        {acc.label} &bull; {acc.role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                {/* Selected account summary pill */}
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white p-2.5">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200">
                    <Image
                      src={selectedAccount.avatar}
                      alt={selectedAccount.fullName}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {selectedAccount.fullName}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-600">
                        {selectedAccount.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{selectedAccount.blurb}</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(selectedAccount.username, selectedAccount.password)}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-rose-700 hover:to-rose-800 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Sign In as {selectedAccount.fullName}</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>

              {/* Or divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                  <span className="bg-white px-3 tracking-widest">Or enter manual credentials</span>
                </div>
              </div>

              {/* Standard Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="username" className="block text-xs font-semibold text-slate-700">
                    Username
                  </label>
                  <div className="relative mt-1">
                    <User size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. brian.mugambi"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Lock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Standard Sign In"}
                </button>
              </form>
            </div>

            {/* Bottom Footer */}
            <div className="mt-6 border-t border-slate-100 pt-4 text-center">
              <p className="text-xs text-slate-600">
                Need an account or guide for your role?{" "}
                <Link
                  href="/signup"
                  className="font-bold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  Sign up &amp; Role Guide &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Kenya Pipeline Company Limited &bull; Revenue Assurance Division
      </footer>
    </div>
  );
}
