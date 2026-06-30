"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Predict (XGB)",
      path: "/",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: "Cat vs Dog (CNN)",
      path: "/catdog",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="w-64 h-full bg-zinc-950/80 backdrop-blur-md border-r border-zinc-800/80 flex flex-col justify-between py-6 shadow-2xl relative z-40">
      <div className="px-6 flex flex-col gap-10">
        
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded bg-white flex items-center justify-center font-black text-black text-2xl group-hover:bg-lime-400 group-hover:shadow-[0_0_15px_rgba(163,230,53,0.5)] transition-all">
            A
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-lime-400 transition-colors">
              Data Mining
            </span>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Terminal</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex flex-col gap-3">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-sm ${
                  isActive
                    ? "bg-lime-900/20 text-lime-400 border border-lime-900/50 shadow-lg shadow-black/40 translate-x-1"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/60 hover:border hover:border-zinc-800 hover:translate-x-1"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Connect/System Status */}
      <div className="px-6">
        <div className="flex flex-col gap-2 p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 glass-panel">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
            <span className="text-xs font-bold text-zinc-200">System Active</span>
          </div>
          <p className="text-[10px] font-semibold text-zinc-400 leading-relaxed uppercase tracking-wider">
            Connected to Local Inference Engine
          </p>
        </div>
      </div>
    </div>
  );
}
