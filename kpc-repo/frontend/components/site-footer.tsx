import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-kpc-gray-800 bg-kpc-black text-kpc-gray-400">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-semibold text-white">Kenya Pipeline Company</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              Moving Kenya&apos;s fuel from Mombasa to five inland terminals,
              and accounting for every minute a truck spends at our gantries.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Terminals</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>Kipevu, Mombasa</li>
              <li>Nairobi (Embakasi)</li>
              <li>Nakuru</li>
              <li>Eldoret</li>
              <li>Kisumu</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Revenue assurance</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/login" className="hover:text-white">
                  Portal sign in
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white">
                  Register as an OMC
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-white">
                  How charges are calculated
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Talk to us</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>Emergency hotline: 0800 720 198</li>
              <li>Revenue assurance: 0800 721 400</li>
              <li>revenue.assurance@kpc.co.ke</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-kpc-gray-800 pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>Kenya Pipeline Company Ltd. A state corporation under the Ministry of Energy and Petroleum.</p>
          <p>Revenue Assurance &amp; Demurrage Engine, v2.4</p>
        </div>
      </div>
    </footer>
  );
}
