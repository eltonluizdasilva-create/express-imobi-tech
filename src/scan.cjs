const fs = require('fs');
const path = require('path');
const dir = '.';
const files = [];

function walk(d) {
  const entries = fs.readdirSync(d, { withFileTypes: true });
  for (const e of entries) {
    const f = path.join(d, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist') {
      walk(f);
    } else if (/\.(jsx?|tsx?)$/.test(e.name)) {
      files.push(f);
    }
  }
}

walk(dir);

let total = 0;
const byFile = {};
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  const lines = c.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/[Ã]/g.test(lines[i])) {
      total++;
      if (!byFile[f]) byFile[f] = [];
      byFile[f].push(i + 1);
    }
  }
}

console.log(`Total lines with corrupted chars: ${total}`);
console.log(`Files affected: ${Object.keys(byFile).length}`);
for (const [f, lines] of Object.entries(byFile)) {
  console.log(`${path.relative('.', f)}: lines ${lines.slice(0, 5).join(', ')}${lines.length > 5 ? '...' : ''}`);
}
