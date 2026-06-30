const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'app/page.tsx',
  'app/catdog/page.tsx',
  'components/StatusPill.tsx',
  'components/ErrorAlert.tsx',
  'components/OfflineBanner.tsx',
  'components/PageHeader.tsx'
];

const replacements = [
  { from: /\bbg-slate-900\b/g, to: 'bg-zinc-900/40 glass-panel' },
  { from: /\bbg-slate-800\b/g, to: 'bg-zinc-900/60 glass-panel' },
  { from: /\bborder-slate-800\b/g, to: 'border-zinc-800/80' },
  { from: /\bborder-slate-700\b/g, to: 'border-zinc-700/80' },
  
  { from: /\btext-slate-200\b/g, to: 'text-zinc-200' },
  { from: /\btext-slate-300\b/g, to: 'text-zinc-300' },
  { from: /\btext-slate-400\b/g, to: 'text-zinc-400' },
  
  { from: /\btext-indigo-400\b/g, to: 'text-lime-400' },
  { from: /\btext-indigo-600\b/g, to: 'text-lime-500' },
  { from: /\bbg-indigo-900\/30\b/g, to: 'bg-lime-900/20' },
  { from: /\bborder-indigo-800\/50\b/g, to: 'border-lime-900/50' },
  
  // Update hover effects to lime
  { from: /\bhover:bg-slate-800\b/g, to: 'hover:bg-zinc-800/80' },
  { from: /\bhover:text-indigo-600\b/g, to: 'hover:text-lime-400' },
  { from: /\bselection:bg-indigo-200\b/g, to: 'selection:bg-lime-500/30' },
  
  // Specific Ape Terminal touches
  { from: /\bshadow-md\b/g, to: 'shadow-2xl shadow-black/50' },
  { from: /\bshadow-sm\b/g, to: 'shadow-lg shadow-black/40' },
  
  // Colors for catdog results to match vibe
  { from: /\bbg-orange-400\b/g, to: 'bg-amber-500 text-black font-black' },
  { from: /\bbg-blue-400\b/g, to: 'bg-cyan-500 text-black font-black' },
];

for (const relPath of filesToProcess) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let originalContent = content;
  
  for (const { from, to } of replacements) {
    content = content.replace(from, to);
  }

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`Updated for Ape Terminal style: ${relPath}`);
  }
}
