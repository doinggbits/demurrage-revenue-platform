"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import AboutContent from "../portal/about/page";

export default function PublicAboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <AboutContent />
      </main>
      <SiteFooter />
    </div>
  );
}
