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

const corruptedByFile = {};
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  const lines = c.split('\n');
  const badLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (/[Ã]/g.test(lines[i])) {
      badLines.push({ line: i + 1, text: lines[i] });
    }
  }
  if (badLines.length > 0) {
    corruptedByFile[f] = badLines;
  }
}

for (const [f, badLines] of Object.entries(corruptedByFile)) {
  console.log(`\n=== ${path.relative('.', f)} ===`);
  for (const { line, text } of badLines.slice(0, 3)) {
    console.log(`Line ${line}: ${text.substring(0, 120)}`);
  }
}
