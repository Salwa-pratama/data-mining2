const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'components/Navbar.tsx',
  'app/page.tsx',
  'app/catdog/page.tsx'
];

const replacements = [
  // 1. Borders
  { from: /border-4 border-black/g, to: 'border border-slate-200' },
  { from: /border-2 border-black/g, to: 'border border-slate-200' },
  { from: /border-black/g, to: 'border-slate-200' },
  
  // 2. Shadows (using standard Tailwind shadows instead of hard offsets)
  // Be careful with shadow-[...] regex to escape brackets
  { from: /shadow-\[1px_1px_0px_0px_rgba\(0,0,0,1\)\]/g, to: 'shadow-sm' },
  { from: /shadow-\[2px_2px_0px_0px_rgba\(0,0,0,1\)\]/g, to: 'shadow-sm' },
  { from: /shadow-\[3px_3px_0px_0px_rgba\(0,0,0,1\)\]/g, to: 'shadow-sm' },
  { from: /shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\]/g, to: 'shadow-md' },
  { from: /shadow-\[5px_5px_0px_0px_rgba\(0,0,0,1\)\]/g, to: 'shadow-md' },
  { from: /shadow-\[6px_6px_0px_0px_rgba\(0,0,0,1\)\]/g, to: 'shadow-lg' },
  
  // Hover/Active/Group-Hover translation removing
  { from: /hover:translate-x-\[-1px\] hover:translate-y-\[-1px\]/g, to: '' },
  { from: /hover:translate-x-\[-2px\] hover:translate-y-\[-2px\]/g, to: '' },
  { from: /hover:translate-x-\[-3px\] hover:translate-y-\[-3px\]/g, to: '' },
  { from: /active:translate-x-\[0px\] active:translate-y-\[0px\] active:shadow-none/g, to: 'active:scale-[0.98]' },
  { from: /translate-x-\[-2px\] translate-y-\[-2px\]/g, to: '' },
  { from: /translate-x-\[-3px\] translate-y-\[-3px\]/g, to: '' },
  
  { from: /group-hover:translate-x-\[-1px\] group-hover:translate-y-\[-1px\]/g, to: '' },
  { from: /group-hover:translate-x-\[-2px\] group-hover:translate-y-\[-2px\]/g, to: '' },
  
  // Hover Shadows
  { from: /hover:shadow-\[3px_3px_0px_0px_rgba\(0,0,0,1\)\]/g, to: 'hover:shadow-md' },
  { from: /hover:shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\]/g, to: 'hover:shadow-md' },
  { from: /hover:shadow-\[5px_5px_0px_0px_rgba\(0,0,0,1\)\]/g, to: 'hover:shadow-lg' },
  { from: /group-hover:shadow-\[5px_5px_0px_0px_rgba\(0,0,0,1\)\]/g, to: 'group-hover:shadow-md' },
  
  // 3. Colors
  { from: /bg-yellow-400/g, to: 'bg-white' },
  { from: /bg-cyan-400/g, to: 'bg-white' },
  { from: /bg-fuchsia-400/g, to: 'bg-white' },
  { from: /bg-amber-400/g, to: 'bg-white' },
  { from: /bg-pink-400/g, to: 'bg-slate-50' },
  { from: /bg-indigo-400/g, to: 'bg-indigo-50 text-indigo-700' },
  { from: /text-black/g, to: 'text-slate-800' },
  
  // Special status/alert colors to softer variants
  { from: /bg-rose-400/g, to: 'bg-rose-50 text-rose-700 border-rose-200' },
  { from: /text-rose-800/g, to: 'text-rose-700' },
  { from: /text-red-700/g, to: 'text-red-600' },
  { from: /text-red-900/g, to: 'text-red-700' },
  
  // Special buttons or pills
  { from: /bg-emerald-400/g, to: 'bg-emerald-50 border-emerald-200' },
  { from: /text-emerald-800/g, to: 'text-emerald-700' }
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
  
  // cleanup extra spaces caused by empty replacements
  content = content.replace(/\s{2,}/g, (match) => {
    // only collapse spaces if it's within a class string, but simple double space to single space inside quotes is safer.
    return match;
  });
  
  // A safer space cleanup just for spaces
  content = content.replace(/className="([^"]+)"/g, (match, p1) => {
    return `className="${p1.replace(/\s+/g, ' ').trim()}"`;
  });
  content = content.replace(/className=\{`([^`]+)`\}/g, (match, p1) => {
    return `className={\`${p1.replace(/ +/g, ' ')}\`}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`Updated: ${relPath}`);
  } else {
    console.log(`No changes made to: ${relPath}`);
  }
}
