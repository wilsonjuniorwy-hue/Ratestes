import fs from 'fs';
import path from 'path';

const root = "c:\\Users\\wagne\\JR - Arquivos\\SISTEMAS\\gestão-de-reserva-de-armamento-pm";

function search(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
          results = results.concat(search(fullPath));
        }
      } else {
        const fileLower = file.toLowerCase();
        if (fileLower.includes('usuario') || fileLower.includes('pasta') || fileLower.includes('xlsx')) {
          results.push({ path: fullPath, size: stat.size });
        }
      }
    });
  } catch (err) {}
  return results;
}

console.log("Arquivos encontrados:");
console.log(JSON.stringify(search(root), null, 2));
