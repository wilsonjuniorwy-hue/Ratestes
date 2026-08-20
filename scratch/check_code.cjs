const fs = require('fs');

const files = [
  'src/components/ArmeiroView.tsx',
  'src/components/TotemView.tsx',
  'src/components/BancoDadosView.tsx',
  'src/hooks/useOfflineDatabase.ts',
  'src/hooks/useSupabaseDatabase.ts'
];

for (const file of files) {
  console.log('=== FILE: ' + file + ' ===');
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  lines.forEach((line, idx) => {
    if (line.includes(".from('materiais')") || line.includes('controle_quantidade') || line.includes('BAT-HYTERA') || line.includes('adicionarMaterial') || line.includes('confirmarEntrada') || line.includes('confirmarRetirada')) {
      console.log(`  L${idx+1}: ${line.trim()}`);
    }
  });
}
