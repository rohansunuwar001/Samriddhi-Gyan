const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all JSX/TSX files in both admin and instructor page folders
const roots = [
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/admin',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/instructor',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/pages/student',
  'c:/Users/user/Desktop/Samriddhi Gyan/client/src/components',
];

function getAllJsx(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllJsx(fullPath, result);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx')) {
      result.push(fullPath);
    }
  }
  return result;
}

const allFiles = roots.flatMap(r => getAllJsx(r));
console.log(`Found ${allFiles.length} JSX/TSX files to process.`);

// We apply size changes from large to small to avoid double-bumping
// The map is: current class -> new class
const SIZE_REPLACEMENTS = [
  // scale up each tier by one step
  [/\btext-5xl\b/g, 'text-6xl'],
  [/\btext-4xl\b/g, 'text-5xl'],
  [/\btext-3xl\b/g, 'text-4xl'],
  [/\btext-2xl\b/g, 'text-3xl'],
  [/\btext-xl\b/g, 'text-2xl'],
  [/\btext-lg\b/g, 'text-xl'],
  [/\btext-base\b/g, 'text-lg'],
  [/\btext-sm\b/g, 'text-base'],
  [/\btext-xs\b/g, 'text-sm'],
];

// We do NOT touch text-\[...\] inline sizes — only tailwind utilities

const WEIGHT_REPLACEMENTS = [
  [/\bfont-black\b/g, 'font-normal'],
  [/\bfont-extrabold\b/g, 'font-normal'],
  [/\bfont-bold\b/g, 'font-normal'],
  [/\bfont-semibold\b/g, 'font-normal'],
  [/\bfont-medium\b/g, 'font-light'],
];

let totalChanged = 0;

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Apply size changes
  for (const [regex, replacement] of SIZE_REPLACEMENTS) {
    content = content.replace(regex, replacement);
  }

  // Apply weight changes
  for (const [regex, replacement] of WEIGHT_REPLACEMENTS) {
    content = content.replace(regex, replacement);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated: ${filePath.split('/').slice(-3).join('/')}`);
    totalChanged++;
  }
}

console.log(`\nDone. ${totalChanged} files updated.`);
