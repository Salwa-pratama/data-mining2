const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'app/page.tsx',
  'app/catdog/page.tsx'
];

const replacements = [
  { from: /from-indigo-900\/20/g, to: 'from-lime-900/10' },
  { from: /bg-indigo-900\/30/g, to: 'bg-lime-900/10' },
  { from: /bg-violet-400\/40/g, to: 'bg-zinc-800/20' },
  { from: /text-indigo-400\/40/g, to: 'text-lime-400/20' },
  { from: /focus:border-indigo-500/g, to: 'focus:border-lime-500' },
  { from: /text-indigo-800/g, to: 'text-lime-600' },
  { from: /border-t-indigo-600/g, to: 'border-t-lime-500' },
  { from: /text-indigo-850/g, to: 'text-lime-600' },
  { from: /border-indigo-600/g, to: 'border-lime-500' },
  { from: /hover:border-indigo-600/g, to: 'hover:border-lime-500' },
  { from: /hover:bg-indigo-300/g, to: 'hover:bg-zinc-800/50' },
  { from: /selection:bg-indigo-200/g, to: 'selection:bg-lime-500/30' },
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
    console.log(`Cleaned up indigo in: ${relPath}`);
  }
}
