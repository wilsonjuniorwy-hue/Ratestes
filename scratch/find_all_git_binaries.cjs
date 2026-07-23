const fs = require('fs');
const path = require('path');

function searchFile(dir, pattern, depth = 0) {
  if (depth > 6) return;
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          searchFile(full, pattern, depth + 1);
        } else if (pattern.test(f)) {
          console.log('FOUND BINARY:', full);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log('Searching for git binaries...');
searchFile('C:\\Users\\wagne', /^git.*\.exe$/i);
searchFile('C:\\Users\\wagne', /^git.*\.cmd$/i);
searchFile('C:\\Program Files', /^git.*\.exe$/i);
searchFile('C:\\Program Files (x86)', /^git.*\.exe$/i);
