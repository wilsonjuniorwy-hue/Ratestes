const fs = require('fs');
const path = require('path');

const compDir = path.join(__dirname, '..', 'src', 'components');
const files = fs.readdirSync(compDir);

for (const file of files) {
  if (file.endsWith('.tsx')) {
    const content = fs.readFileSync(path.join(compDir, file), 'utf8');
    if (content.includes('estoqueAgrupado') || content.includes('setConferidos') || content.includes('conferidos[')) {
      console.log('File containing estoqueAgrupado:', file);
    }
  }
}
