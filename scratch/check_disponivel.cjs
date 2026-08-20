const fs = require('fs');

const files = [
  'src/components/TotemView.tsx',
  'src/components/ArmeiroView.tsx',
  'src/components/BancoDadosView.tsx',
  'src/components/AdminPanelView.tsx'
];

for (const file of files) {
  console.log('=== FILE: ' + file + ' ===');
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('getQuantidadeDisponivel') || line.includes('totalCautelado') || line.includes('disponivelQty') || line.includes('estado_devolucao') || line.includes('activeCautelasSet')) {
      console.log(`  L${idx+1}: ${line.trim()}`);
    }
  });
}
