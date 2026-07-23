const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, '..', 'backup_reserva_armamento.json');
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

const rpmonId = '5c4026ec-6c75-408d-8e26-81a13ecab933';

// Remover o item 'BASTÃO' antigo com quantidade 68 se existir e substituir pelo BASTAO-SEM-NUMERO (12 un)
backupData.materiais = backupData.materiais.filter(m => m.id_material !== 'BASTÃO' && m.id_material !== 'BASTAO-SEM-NUMERO');

backupData.materiais.push({
  id_material: 'BASTAO-SEM-NUMERO',
  id_categoria: 'CAT-493',
  modelo: 'Bastao Policial (Sem Numero)',
  fabricante: 'Dotacao PMDF',
  calibre: 'N/A',
  status_atual: 'disponivel',
  data_aquisicao: '2026-07-23',
  data_ultima_manutencao: null,
  especificacoes_tecnicas: 'Bastões policiais sem número de série individual',
  controle_quantidade: true,
  quantidade: 12,
  id_arma_vinculada: null,
  quantidade_carregadores: null,
  id_quartel: rpmonId,
  deletado_em: null
});

fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
console.log('backup_reserva_armamento.json atualizado com o lote de 12 bastoes sem numero!');

// Atualizar mockData.ts
const mockDataPath = path.join(__dirname, '..', 'src', 'mockData.ts');
let mockContent = fs.readFileSync(mockDataPath, 'utf8');

if (!mockContent.includes("id_material: 'BASTAO-SEM-NUMERO'")) {
  const itemMock = `  {
    id_material: 'BASTAO-SEM-NUMERO',
    id_categoria: 'CAT-493',
    modelo: 'Bastao Policial (Sem Numero)',
    fabricante: 'Dotacao PMDF',
    calibre: 'N/A',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Bastões policiais sem número de série individual',
    controle_quantidade: true,
    quantidade: 12,
    quantidade_carregadores: null
  },`;

  mockContent = mockContent.replace(
    'export const mockMateriais: Material[] = [',
    `export const mockMateriais: Material[] = [\n${itemMock}`
  );
  fs.writeFileSync(mockDataPath, mockContent, 'utf8');
  console.log('mockData.ts atualizado com BASTAO-SEM-NUMERO (12 un)!');
}

// Gerar SQL complementar bastoes_sem_numero.sql
const sql = `-- INSERCAO DO LOTE DE 12 BASTOES SEM NUMERO NO SUPABASE
INSERT INTO materiais (
  id_material, id_categoria, modelo, fabricante, calibre, status_atual, data_aquisicao, controle_quantidade, quantidade, id_quartel
) VALUES (
  'BASTAO-SEM-NUMERO', 'CAT-493', 'Bastao Policial (Sem Numero)', 'Dotacao PMDF', 'N/A', 'disponivel', '2026-07-23', true, 12, '${rpmonId}'
) ON CONFLICT (id_material) DO UPDATE SET
  quantidade = 12,
  modelo = EXCLUDED.modelo,
  controle_quantidade = true,
  status_atual = 'disponivel';
`;

fs.writeFileSync(path.join(__dirname, '..', 'bastoes_sem_numero.sql'), sql, 'utf8');
console.log('bastoes_sem_numero.sql gerado com sucesso!');
