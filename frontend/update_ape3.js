const fs = require('fs');
const path = require('path');

function injectAnimation(relPath) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let originalContent = content;
  
  // Find the first flex-col gap-6 (which wraps the tabs and main content)
  content = content.replace(/className="flex flex-col gap-6"/, 'className="flex flex-col gap-6 opacity-0 animate-fade-in-up delay-100"');
  
  // Find grid grid-cols-1 (which wraps the layout)
  content = content.replace(/className="grid grid-cols-1/g, 'className="grid grid-cols-1 opacity-0 animate-fade-in-up delay-200');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`Animated: ${relPath}`);
  }
}

injectAnimation('app/page.tsx');
injectAnimation('app/catdog/page.tsx');
