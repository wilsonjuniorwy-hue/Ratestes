const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, '..', 'backup_reserva_armamento.json');
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

const bastoes = backupData.materiais.filter(m => {
  return m.id_categoria === 'CAT-493' ||
    /^B\d+$/i.test(m.modelo.trim()) ||
    /^BASTAO/i.test(m.modelo.trim()) ||
    /^BASTÃO/i.test(m.modelo.trim()) ||
    /^BASTAO/i.test(m.id_material.trim()) ||
    /^BASTÃO/i.test(m.id_material.trim());
});

console.log('--- TODOS OS ITENS DE BASTAO NO BACKUP ---');
let grandTotal = 0;
bastoes.forEach(b => {
  const qty = b.controle_quantidade ? (b.quantidade || 0) : 1;
  grandTotal += qty;
  console.log(`ID: ${b.id_material} | Modelo: "${b.modelo}" | Qtd: ${b.quantidade} | ControleQtd: ${b.controle_quantidade} | Calc: ${qty}`);
});

console.log('TOTAL CALCULADO NO BACKUP:', grandTotal);
