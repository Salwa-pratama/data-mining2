import React from "react";

interface OfflineBannerProps {
  message?: string;
}

export default function OfflineBanner({ message }: OfflineBannerProps) {
  return (
    <div className="bg-zinc-900/60 glass-panel border border-zinc-800/80 rounded-xl p-4 flex items-start gap-3 shadow-2xl shadow-black/50">
      <svg
        className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-zinc-200">
          Backend tidak dapat dihubungi
        </p>
        <p className="text-xs font-semibold text-zinc-200 mt-1 uppercase tracking-wide">
          {message || (
            <>Pastikan menjalankan <b>python app.py</b> di folder frontend/backend.</>
          )}
        </p>
      </div>
    </div>
  );
}
