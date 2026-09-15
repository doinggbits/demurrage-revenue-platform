import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-kpc-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/kpc/kpc_logo_long.png"
            alt="Kenya Pipeline Company"
            width={180}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-600 lg:flex">
          <a href="/#network" className="hover:text-rose-600 transition-colors">
            Pipeline Network
          </a>
          <a href="/#formula" className="hover:text-rose-600 transition-colors">
            12-Step Formula
          </a>
          <a href="/#calculator" className="hover:text-rose-600 transition-colors">
            Demurrage Calculator
          </a>
          <Link href="/about" className="hover:text-rose-600 transition-colors">
            Developers &amp; Team
          </Link>
          <a href="/#faq" className="hover:text-rose-600 transition-colors">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-600 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-gradient-to-r from-[#E30613] via-[#F43F5E] to-[#FB7185] px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-rose-500/20 transition-all hover:brightness-110"
          >
            Enter Portal
          </Link>
        </div>
      </div>
    </header>
  );
}
