"use client";

import Link from "next/link";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">

        {/* Search */}

        <div className="flex-1 max-w-xl">
          <input
            type="text"
            placeholder="ابحث عن فريق، دوري أو مباراة..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white outline-none transition focus:border-cyan-500"
          />
        </div>

        {/* Right Side */}

        <div className="flex items-center gap-4">

          <button className="relative rounded-xl bg-slate-900 p-3 hover:bg-slate-800">
            🔔

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl bg-slate-900 px-3 py-2 hover:bg-slate-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 font-bold text-slate-950">
              A
            </div>

            <div className="hidden text-right lg:block">
              <p className="text-sm font-bold text-white">
                Administrator
              </p>

              <p className="text-xs text-slate-400">
                Premium Account
              </p>
            </div>
          </Link>

        </div>

      </div>
    </header>
  );
}