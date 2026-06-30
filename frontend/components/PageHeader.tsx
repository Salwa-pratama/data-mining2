import React from "react";

interface PageHeaderProps {
  title: string;
  description: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="text-center py-16 flex flex-col items-center justify-center relative z-20 opacity-0 animate-fade-in-up">
      <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 drop-shadow-lg leading-tight max-w-4xl">
        {title}
      </h2>
      <p className="text-zinc-400 text-sm md:text-base font-medium max-w-xl leading-relaxed">
        {description}
      </p>
      
      {/* Ape Terminal style social/action buttons below header */}
      <div className="flex items-center gap-3 mt-8">
        {['⌘', '⚡', '⎈'].map((icon, i) => (
          <div key={i} className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-lime-500 transition-colors cursor-pointer shadow-lg shadow-black/50">
            {icon}
          </div>
        ))}
      </div>
    </div>
  );
}
