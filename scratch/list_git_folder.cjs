const fs = require('fs');
const path = require('path');

function listFolder(dir) {
  console.log('--- LISTING:', dir);
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        console.log(`  [${stat.isDirectory() ? 'DIR' : 'FILE'}] ${f}`);
      } catch (e) {
        console.log(`  [ERR] ${f}`);
      }
    }
  } catch (e) {
    console.error('Cannot read dir:', e.message);
  }
}

listFolder('C:\\Users\\wagne\\AppData\\Local\\Programs\\Git');
listFolder('C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\cmd');
listFolder('C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\bin');
