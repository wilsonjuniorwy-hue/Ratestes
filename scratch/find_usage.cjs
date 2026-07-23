const fs = require('fs');
const path = require('path');

function searchInDir(dir, targetText) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchInDir(fullPath, targetText);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(targetText)) {
        console.log('FOUND IN FILE:', fullPath);
      }
    }
  }
}

searchInDir(path.join(__dirname, '..', 'src'), 'OcorrenciasView');
