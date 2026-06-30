const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'components/Navbar.tsx',
  'app/page.tsx',
  'app/catdog/page.tsx'
];

const replacements = [
  // Fix thick borders
  { from: /\bborder-4\b/g, to: 'border' },
  { from: /\bborder-2\b/g, to: 'border' },
  { from: /\bborder-b-4\b/g, to: 'border-b' },
  { from: /\bborder-t-4\b/g, to: 'border-t' },
  { from: /\bborder-l-4\b/g, to: 'border-l' },
  { from: /\bborder-r-4\b/g, to: 'border-r' },
  { from: /\bborder-b-2\b/g, to: 'border-b' },
  { from: /\bborder-t-2\b/g, to: 'border-t' },
  { from: /\bborder-l-2\b/g, to: 'border-l' },
  { from: /\bborder-r-2\b/g, to: 'border-r' },
  
  // Also just clean up any remaining text-black that was missed?
  { from: /\btext-black\b/g, to: 'text-slate-800' }
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
  
  // Replace double classes like "border border-slate-200 border-emerald-200"
  content = content.replace(/border border-slate-200 bg-emerald-50 border-emerald-200/g, 'border bg-emerald-50 border-emerald-200');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`Updated (pass 2): ${relPath}`);
  } else {
    console.log(`No changes made to: ${relPath}`);
  }
}
