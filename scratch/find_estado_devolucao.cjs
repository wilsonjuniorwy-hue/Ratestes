const fs = require('fs');
const path = require('path');

function search(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (f === 'node_modules' || f === 'dist' || f === '.git') continue;
    if (fs.statSync(full).isDirectory()) search(full);
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('estado_devolucao')) {
          console.log(`${full}:${idx + 1} -> ${line.trim()}`);
        }
      });
    }
  }
}

search('./src');
