const fs = require('fs');
const path = require('path');

function searchShortcuts(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          searchShortcuts(full);
        } else if (f.toLowerCase().includes('git') || f.toLowerCase().includes('github')) {
          console.log('FOUND SHORTCUT/PROGRAM:', full);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log('Searching Start Menu...');
searchShortcuts('C:\\Users\\wagne\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs');
searchShortcuts('C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs');

console.log('Searching AppData/Local...');
searchShortcuts('C:\\Users\\wagne\\AppData\\Local');
