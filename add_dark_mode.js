const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /(?<!dark:)bg-white(?!\/)/g, replace: 'bg-white dark:bg-slate-800' },
  { regex: /(?<!dark:)bg-white\/95/g, replace: 'bg-white/95 dark:bg-slate-800/95' },
  { regex: /(?<!dark:)bg-\[#F8FAFC\]/g, replace: 'bg-[#F8FAFC] dark:bg-slate-900' },
  { regex: /(?<!dark:)bg-\[#F1F5F9\]/g, replace: 'bg-[#F1F5F9] dark:bg-slate-700' },
  { regex: /(?<!dark:)text-\[#0F172A\]/g, replace: 'text-[#0F172A] dark:text-white' },
  { regex: /(?<!dark:)text-\[#64748B\]/g, replace: 'text-[#64748B] dark:text-slate-400' },
  { regex: /(?<!dark:)text-slate-800/g, replace: 'text-slate-800 dark:text-slate-100' },
  { regex: /(?<!dark:)text-slate-500/g, replace: 'text-slate-500 dark:text-slate-400' },
  { regex: /(?<!dark:)border-\[#E2E8F0\]/g, replace: 'border-[#E2E8F0] dark:border-slate-700' },
  { regex: /(?<!dark:)border-slate-200/g, replace: 'border-slate-200 dark:border-slate-700' },
  { regex: /(?<!dark:)border-slate-300/g, replace: 'border-slate-300 dark:border-slate-600' },
  { regex: /(?<!dark:)bg-slate-50(?!0)/g, replace: 'bg-slate-50 dark:bg-slate-800/50' },
  { regex: /(?<!dark:)bg-slate-100/g, replace: 'bg-slate-100 dark:bg-slate-700' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replace } of replacements) {
        content = content.replace(regex, replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Done adding dark classes!');
