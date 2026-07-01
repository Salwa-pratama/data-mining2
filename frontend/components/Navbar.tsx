"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Prediksi Kecelakaan (XGBoost)",
      path: "/",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      activeColor: "bg-indigo-300 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
    },
    {
      name: "Klasifikasi Cat & Dog (CNN)",
      path: "/catdog",
      icon: (
        <span className="text-sm">🐾</span>
      ),
      activeColor: "bg-pink-300 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
    },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b-4 border-black bg-white py-3">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 border-2 border-black bg-amber-300 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg">
            <svg className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 uppercase">
              Data Mining Hub
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Model Deployment</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider border-2 transition-all duration-150 ${
                  isActive
                    ? `${item.activeColor} translate-x-[-3px] translate-y-[-3px]`
                    : "border-black text-slate-700 bg-white hover:text-black hover:bg-slate-50 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side Accent */}
        <div className="hidden md:flex items-center gap-2 border-2 border-black bg-emerald-100 px-3 py-1.5 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold font-mono text-emerald-800 uppercase tracking-widest">Active</span>
        </div>
      </div>
    </nav>
  );
}
