const fs = require('fs');
const path = require('path');

const candidates = [
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files\\Git\\bin\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
  'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\cmd\\git.exe',
  'C:\\Users\\wagne\\AppData\\Local\\GitHubDesktop\\cmd\\git.exe'
];

let foundPath = null;

for (const p of candidates) {
  if (fs.existsSync(p)) {
    console.log('FOUND GIT AT:', p);
    foundPath = p;
  }
}

if (!foundPath) {
  // Buscar no AppData por github desktop ou git
  const appDataLocal = 'C:\\Users\\wagne\\AppData\\Local';
  if (fs.existsSync(appDataLocal)) {
    const entries = fs.readdirSync(appDataLocal);
    for (const e of entries) {
      if (e.toLowerCase().includes('git') || e.toLowerCase().includes('github')) {
        console.log('Possivel pasta Git em AppData/Local:', e);
      }
    }
  }
}
