const fs = require('fs');

const content = fs.readFileSync('src/hooks/useSupabaseDatabase.ts', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('EFETIVAR_DEVOLUCAO') || line.includes('sincronizar') || line.includes('syncQueue') || line.includes('processarFila')) {
    console.log(`L${idx+1}: ${line.trim()}`);
  }
});
