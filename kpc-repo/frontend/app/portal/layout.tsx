"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth-context";
import { navItemsForRole } from "@/lib/nav-items";
import { ROLE_DISPLAY } from "@/lib/types";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";

function PortalShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTerminal, setActiveTerminal] = useState("ALL TERMINALS");

  if (!user) return null;

  const items = navItemsForRole(user.role);
  const roleInfo = ROLE_DISPLAY[user.role];
  const demoAcc = DEMO_ACCOUNTS.find((a) => a.username === user.username || a.role === user.role);
  const avatar = demoAcc?.avatar || "/images/team/brian_mugambi.jpg";

  function handleLogout() {
    logout();
    router.push("/");
  }

  const terminals = [
    "ALL TERMINALS",
    "MOMBASA (KOSF-PS01)",
    "NAIROBI (NBI-PS10)",
    "NAKURU (NAK-PS25)",
    "ELDORET (ELD-PS27)",
    "KISUMU (KIS-PS28)",
  ];

  return (
    <div className="flex min-h-screen flex-col bg-kpc-bg text-kpc-text-2">
      {/* Slim status ribbon */}
      <div className="border-b border-kpc-border bg-white px-4 py-1.5 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="hidden sm:inline">SCADA ONLINE</span>
            </div>
            <span className="hidden text-kpc-text-4 md:inline">|</span>
            <div className="hidden items-center gap-3 text-kpc-text-3 lg:flex text-[11px]">
              <span>MOMBASA: <strong className="text-kpc-text">NORMAL</strong></span>
              <span>•</span>
              <span>LINE 5: <strong className="text-kpc-text font-mono">1,120 m³/h</strong></span>
              <span>•</span>
              <span>REVENUE: <strong className="text-emerald-600 font-mono">KES 18.7M</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative group">
              <button className="flex items-center gap-1.5 rounded-full border border-kpc-border bg-kpc-surface-2 px-3 py-0.5 text-[11px] font-medium text-kpc-text-2 hover:border-kpc-red/40 hover:text-kpc-red transition-colors">
                <Building2 size={12} className="text-kpc-red" />
                <span className="max-w-[140px] truncate">{activeTerminal}</span>
                <ChevronDown size={11} className="text-kpc-text-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 hidden w-52 rounded-xl border border-kpc-border bg-white p-1 shadow-lg group-hover:block z-50">
                {terminals.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTerminal(t)}
                    className={`w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                      activeTerminal === t
                        ? "bg-kpc-red text-white"
                        : "text-kpc-text-2 hover:bg-kpc-bg"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Link
              href="/"
              className="hidden items-center gap-1 text-[11px] text-kpc-text-3 hover:text-kpc-red transition-colors sm:flex"
            >
              Public site <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main header — horizontal nav, no sidebar */}
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/portal/dashboard" className="flex items-center gap-3">
              <Image
                src="/images/kpc/kpc_logo_long.png"
                alt="Kenya Pipeline Company"
                width={150}
                height={34}
                className="h-8 w-auto"
                priority
              />
              <span className="hidden sm:inline-flex items-center rounded-md border border-kpc-red/20 bg-kpc-red-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-kpc-red">
                Revenue Assurance
              </span>
            </Link>
          </div>

          <nav className="hidden xl:flex items-center gap-0.5 overflow-x-auto py-1">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-tight transition-all duration-200 ${
                    active
                      ? "bg-kpc-red text-white shadow-md shadow-kpc-red/25"
                      : "text-kpc-text-3 hover:bg-kpc-bg hover:text-kpc-text"
                  }`}
                >
                  <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-slate-200 shadow-sm hidden sm:block shrink-0">
              <Image
                src={avatar}
                alt={user.full_name}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-kpc-text tracking-tight">{user.full_name}</p>
              <p className="text-[10px] font-medium text-kpc-text-3 flex items-center justify-end gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {roleInfo?.label ?? user.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center gap-1.5 rounded-full border border-kpc-border bg-white px-3 py-1.5 text-xs font-medium text-kpc-text-2 transition-colors hover:border-kpc-red hover:bg-kpc-red hover:text-white"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-kpc-border bg-white p-2 text-kpc-text-2 hover:text-kpc-red xl:hidden"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* lg–xl secondary nav */}
        <div className="hidden lg:flex xl:hidden border-t border-kpc-border bg-kpc-surface-2 px-4 py-2">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    active
                      ? "bg-kpc-red text-white shadow-sm"
                      : "text-kpc-text-3 hover:bg-white hover:text-kpc-text"
                  }`}
                >
                  <Icon size={13} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-b border-kpc-border bg-white p-4 xl:hidden shadow-lg">
            <div className="mb-3 flex items-center justify-between rounded-xl bg-kpc-bg p-3">
              <div>
                <p className="text-xs font-bold text-kpc-text">{user.full_name}</p>
                <p className="text-[11px] text-kpc-text-3">{roleInfo?.label ?? user.role}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                ACTIVE
              </span>
            </div>
            <nav className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-kpc-red text-white font-bold"
                        : "bg-kpc-bg text-kpc-text-2 hover:bg-kpc-red-soft hover:text-kpc-red"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>

      <footer className="border-t border-kpc-border bg-white py-5 text-xs text-kpc-text-3">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/images/kpc/kpc_logo.png"
              alt="KPC"
              width={24}
              height={24}
              className="h-5 w-auto opacity-70"
            />
            <span>
              &copy; {new Date().getFullYear()} Kenya Pipeline Company Limited · Revenue Assurance
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              TELEMETRY VERIFIED
            </span>
            <span className="text-kpc-text-4">ISO 9001:2015</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <PortalShell>{children}</PortalShell>
    </RequireAuth>
  );
}
