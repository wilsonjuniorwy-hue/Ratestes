const fs = require('fs');
const path = require('path');

const rawInput = `
Bastao 120
Bastao 142
Bastao 125
Bastao 101
Bastao 24
Bastao 111
Bastao 80
Bastao 76
Bastao 99
Bastao 127
Bastao 44
Bastao 121
Bastao 83
Bastao 142
Bastao 97
Bastao 53
Bastao 147
Bastao 48
Bastao 87
Bastao 43
Bastao 93
Bastao 119
Bastao 92
Bastao 150
Bastao 22
Bastao 46
Bastao 145
Bastao 122
Bastao 13
Bastao 105
Bastao 68
Bastao 133
Bastao 34
Bastao 20
Bastao 25
Bastao 139
Bastao 28
Bastao 64
Bastao 52
Bastao 211
Bastao 70
Bastao 130
Bastao 123
Bastao 05
Bastao 65
Bastao 73
Bastao 54
Bastao 107
Bastao 39
Bastao 29
Bastao 71
Bastao 06
Bastao 72
Bastao 74
Bastao 95
Bastao 35
Bastao 113
Bastao 110
Bastao 14
Bastao 112
Bastao 20
Bastao 34
Bastao 40
Bastao 06
Bastao 29
Bastao 12
Bastao 37
Bastao 45
`;

const lines = rawInput.trim().split('\n').map(l => l.trim()).filter(Boolean);
const nums = [];
const seen = new Set();

for (const line of lines) {
  const match = line.match(/^Bastao\s+(\d+)$/i);
  if (match) {
    const num = match[1];
    if (!seen.has(num)) {
      seen.add(num);
      nums.push(num);
    }
  }
}

console.log('Total de bastoes unicos extraidos:', nums.length);

const backupPath = path.join(__dirname, '..', 'backup_reserva_armamento.json');
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// RPMon id
const rpmonId = '5c4026ec-6c75-408d-8e26-81a13ecab933';

const newMaterials = nums.map(num => ({
  id_material: num,
  id_categoria: 'CAT-493',
  modelo: 'B' + num,
  fabricante: '',
  calibre: '',
  status_atual: 'disponivel',
  data_aquisicao: '2026-07-23',
  data_ultima_manutencao: null,
  especificacoes_tecnicas: '',
  controle_quantidade: false,
  quantidade: 1,
  id_arma_vinculada: null,
  quantidade_carregadores: null,
  id_quartel: rpmonId,
  deletado_em: null
}));

const existingIds = new Set(backupData.materiais.map(m => m.id_material));
let addedCount = 0;
for (const item of newMaterials) {
  if (!existingIds.has(item.id_material)) {
    backupData.materiais.push(item);
    existingIds.add(item.id_material);
    addedCount++;
  }
}

fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
console.log('Novos bastoes adicionados com sucesso ao backup_reserva_armamento.json:', addedCount);
