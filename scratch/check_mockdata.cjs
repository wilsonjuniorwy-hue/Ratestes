const fs = require('fs');
const path = require('path');

const mockPath = path.join(__dirname, '..', 'src', 'mockData.ts');
const mockContent = fs.readFileSync(mockPath, 'utf8');

// Parse mockMateriais array
const match = mockContent.match(/export const mockMateriais: Material\[\] = (\[[\s\S]*?\]);/);
if (match) {
  try {
    // Evaluated via Function
    const materialsStr = match[1];
    const materials = eval(materialsStr);
    
    const bastoes = materials.filter(m => {
      return m.id_categoria === 'CAT-493' ||
        /^B\d+$/i.test(m.modelo.trim()) ||
        /^BASTAO/i.test(m.modelo.trim()) ||
        /^BASTÃO/i.test(m.modelo.trim()) ||
        /^BASTAO/i.test(m.id_material.trim()) ||
        /^BASTÃO/i.test(m.id_material.trim());
    });

    console.log('Total de registros de bastao em mockData.ts:', bastoes.length);
    let total = 0;
    bastoes.forEach(b => {
      const q = b.controle_quantidade ? (b.quantidade || 0) : 1;
      total += q;
      console.log(`Mock ID: ${b.id_material} | Modelo: "${b.modelo}" | Qtd: ${b.quantidade} | Calc: ${q}`);
    });
    console.log('SUM EM MOCKDATA.TS:', total);
  } catch (err) {
    console.error('Error evaluating mockData:', err.message);
  }
} else {
  console.log('mockMateriais not found in mockData.ts');
}
