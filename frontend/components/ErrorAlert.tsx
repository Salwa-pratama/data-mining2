import React from "react";

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  if (!message) return null;
  return (
    <div className="bg-zinc-900/60 glass-panel border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-zinc-200 shadow-2xl shadow-black/50">
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="text-zinc-200 hover:bg-zinc-900/60 glass-panel font-bold h-6 w-6 border border-zinc-800/80 bg-zinc-900/40 glass-panel flex items-center justify-center active:translate-x-0 active:translate-y-0 cursor-pointer"
        aria-label="Dismiss error"
      >
        ✕
      </button>
    </div>
  );
}
