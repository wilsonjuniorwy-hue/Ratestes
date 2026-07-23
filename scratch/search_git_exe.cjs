const fs = require('fs');
const path = require('path');

function searchFile(dir, fileName, depth = 0) {
  if (depth > 5) return;
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          searchFile(full, fileName, depth + 1);
        } else if (f.toLowerCase() === fileName.toLowerCase()) {
          console.log('FOUND:', full);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log('Searching AppData/Local...');
searchFile('C:\\Users\\wagne\\AppData\\Local', 'git.exe');

console.log('Searching AppData/Roaming...');
searchFile('C:\\Users\\wagne\\AppData\\Roaming', 'git.exe');

console.log('Searching Program Files...');
searchFile('C:\\Program Files', 'git.exe');
