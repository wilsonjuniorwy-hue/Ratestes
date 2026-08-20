const fs = require('fs');

const content = fs.readFileSync('src/hooks/useOfflineDatabase.ts', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('EFETIVAR_DEVOLUCAO') || line.includes('EFETIVAR_CAUTELA') || line.includes('sincronizarFila')) {
    console.log(`L${idx+1}: ${line.trim()}`);
  }
});
