const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'app/catdog/page.tsx');

if (fs.existsSync(targetPath)) {
  let content = fs.readFileSync(targetPath, 'utf-8');
  
  // 1. Remove brutalist shadows (8px)
  content = content.replace(/shadow-\[8px_8px_0px_0px_rgba\(0,0,0,1\)\]/g, 'shadow-lg');
  
  // 2. Fix the result card default background (remove the rose tint on the container)
  content = content.replace(/bg-rose-900\/30 text-rose-400 border-rose-800\/50 border border-slate-800/g, 'bg-slate-900 border-slate-800 border text-slate-200');
  
  // 3. Fix the progress bar track in the analysis tab (bg-slate-200 -> bg-slate-950)
  content = content.replace(/bg-slate-200 border border-slate-800 rounded-full overflow-hidden shadow-\[inset_0px_2px_0px_0px_rgba\(0,0,0,0\.1\)\]/g, 'bg-slate-950 border border-slate-800 rounded-full overflow-hidden shadow-inner');
  
  // 4. Fix the indigo badge in the table
  content = content.replace(/bg-indigo-200 border border-slate-800 rounded uppercase text-\[10px\]/g, 'bg-indigo-900/30 text-indigo-400 border border-slate-700 rounded uppercase text-[10px]');
  
  fs.writeFileSync(targetPath, content, 'utf-8');
  console.log('Fixed catdog page styles.');
} else {
  console.log('catdog page not found.');
}
