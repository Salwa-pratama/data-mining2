import React from "react";

interface StatusPillProps {
  online: boolean;
  modelLoaded?: boolean;
  labelOverride?: string; // Optional: custom label
}

export default function StatusPill({ online, modelLoaded, labelOverride }: StatusPillProps) {
  let indicatorColor = "bg-red-500";
  let defaultLabel = "Backend Offline";

  if (online) {
    if (modelLoaded === false) {
      indicatorColor = "bg-amber-500";
      defaultLabel = "Model Belum Loaded";
    } else {
      indicatorColor = "bg-emerald-500 animate-pulse";
      defaultLabel = "Backend Online";
    }
  }

  const displayText = labelOverride || defaultLabel;

  return (
    <div className="flex items-center gap-2 bg-zinc-900/40 glass-panel border border-zinc-800/80 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider shadow-2xl shadow-black/50 w-full md:w-auto justify-center">
      <div className={`h-3 w-3 rounded-full border border-zinc-800/80 ${indicatorColor}`} />
      <span className="text-zinc-200 text-xs font-bold">{displayText}</span>
    </div>
  );
}
