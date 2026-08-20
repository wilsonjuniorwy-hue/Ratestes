const fs = require('fs');
const path = require('path');

const candidates = [
  '../Extras/backup_reserva_armamento.json',
  'Extras/backup_reserva_armamento.json',
  '../backup_reserva_armamento.json',
  'backup_reserva_armamento.json'
];

for (const p of candidates) {
  if (fs.existsSync(p)) {
    console.log('Encontrado backup em:', p);
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (data.materiais) {
        console.log('Materiais com controle_quantidade no backup:');
        data.materiais.filter(m => m.controle_quantidade).forEach(m => {
          console.log(`- ID: ${m.id_material} | Modelo: ${m.modelo} | Qtd: ${m.quantidade}`);
        });
      }
    } catch (e) {
      console.error('Erro ao ler JSON:', e.message);
    }
  }
}
