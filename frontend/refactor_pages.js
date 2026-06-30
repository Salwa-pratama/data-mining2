const fs = require('fs');
const path = require('path');

function refactorFile(filePath, isCatDog) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf-8');

  // Add imports
  if (!content.includes('import StatusPill')) {
    const importStr = `
import StatusPill from "@/components/StatusPill";
import OfflineBanner from "@/components/OfflineBanner";
import ErrorAlert from "@/components/ErrorAlert";
import PageHeader from "@/components/PageHeader";
`;
    // Add right after the first import
    content = content.replace(/(import React.*?;\n)/, `$1${importStr}`);
  }

  // Fix background wrapper
  content = content.replace(/className="min-h-screen bg-slate-[89]00/g, 'className="');

  // Replace Header
  if (isCatDog) {
    const headerRegex = /<div className="text-center bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md max-w-2xl mx-auto w-full">[\s\S]*?<\/div>\s*<\/div>/;
    // Actually simpler to just replace the specific block using exact match or regex.
    content = content.replace(
      /<div className="text-center bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md max-w-2xl mx-auto w-full">\s*<h2[^>]*>\s*Kucing atau Anjing\?\s*<\/h2>\s*<p[^>]*>\s*Upload foto kucing atau anjing, dan model CNN akan mengklasifikasikan gambar secara otomatis\.\s*<\/p>\s*<\/div>/g,
      '<PageHeader title="Kucing atau Anjing?" description="Upload foto kucing atau anjing, dan model CNN akan mengklasifikasikan gambar secara otomatis." />'
    );
  } else {
    content = content.replace(
      /<div className="text-center bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md max-w-2xl mx-auto w-full">\s*<h2[^>]*>\s*Parameter Kecelakaan\s*<\/h2>\s*<p[^>]*>\s*Monitoring & Analisis Insiden\s*<\/p>\s*<\/div>/g,
      '<PageHeader title="Parameter Kecelakaan" description="Monitoring & Analisis Insiden" />'
    );
  }

  // Replace Status Pill
  if (isCatDog) {
    content = content.replace(
      /<div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider shadow-md w-full md:w-auto justify-center">[\s\S]*?<\/div>\s*<\/div>/, // Wait, careful with closing div
      '<StatusPill online={status.online} modelLoaded={status.modelLoaded} />'
    );
  } else {
    content = content.replace(
      /<div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider shadow-md w-full lg:w-auto justify-center">[\s\S]*?<\/div>\s*<\/div>/,
      '<StatusPill online={status.online} labelOverride={status.online ? "Backend Online" : "Backend Offline"} />'
    );
  }
  
  // Actually regex for Status Pill is dangerous because of nested divs. Let's do it with multi_replace_file_content instead or manual string replacement of exact strings.
  
  fs.writeFileSync(fullPath, content, 'utf-8');
}

refactorFile('app/catdog/page.tsx', true);
refactorFile('app/page.tsx', false);
