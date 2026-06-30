const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'app/page.tsx',
  'app/catdog/page.tsx'
];

const replacements = [
  // Backgrounds
  { from: /\bbg-white\b/g, to: 'bg-slate-900' },
  { from: /\bbg-slate-50\b/g, to: 'bg-slate-800' },
  { from: /\bbg-slate-100\b/g, to: 'bg-slate-800' },
  { from: /\bbg-emerald-50\b/g, to: 'bg-emerald-900/30' },
  { from: /\bbg-rose-50\b/g, to: 'bg-rose-900/30' },
  { from: /\bbg-indigo-50\b/g, to: 'bg-indigo-900/30' },
  
  // Text Colors
  { from: /\btext-slate-900\b/g, to: 'text-white' },
  { from: /\btext-slate-800\b/g, to: 'text-slate-200' },
  { from: /\btext-slate-700\b/g, to: 'text-slate-300' },
  { from: /\btext-slate-600\b/g, to: 'text-slate-400' },
  { from: /\btext-slate-500\b/g, to: 'text-slate-400' },
  { from: /\btext-black\b/g, to: 'text-white' },
  
  // Alert Text Colors
  { from: /\btext-emerald-700\b/g, to: 'text-emerald-400' },
  { from: /\btext-rose-700\b/g, to: 'text-rose-400' },
  { from: /\btext-rose-800\b/g, to: 'text-rose-300' },
  { from: /\btext-indigo-700\b/g, to: 'text-indigo-400' },
  { from: /\btext-indigo-650\b/g, to: 'text-indigo-400' }, // Custom one used in stats
  
  // Borders
  { from: /\bborder-slate-200\b/g, to: 'border-slate-800' },
  { from: /\bborder-slate-300\b/g, to: 'border-slate-700' },
  { from: /\bborder-emerald-200\b/g, to: 'border-emerald-800/50' },
  { from: /\bborder-rose-200\b/g, to: 'border-rose-800/50' },
  { from: /\bborder-indigo-200\b/g, to: 'border-indigo-800/50' },
  
  // Backgrounds with gradients (if any)
  { from: /\bfrom-indigo-400\/50\b/g, to: 'from-indigo-900/20' }
];

for (const relPath of filesToProcess) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let originalContent = content;
  
  for (const { from, to } of replacements) {
    content = content.replace(from, to);
  }

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`Updated for Dark Mode: ${relPath}`);
  } else {
    console.log(`No changes made to: ${relPath}`);
  }
}
