-- ====================================================================
-- MASSA DE DADOS DE TESTE - REGIMENTO DE CAVALARIA (HOMOLOGACAO)
-- Execute este script no SQL Editor do seu projeto Supabase de Staging.
-- ====================================================================

-- 1. Inserir 4 Policiais associados ao Regimento de Cavalaria
-- O id_quartel '5c4026ec-6c75-408d-8e26-81a13ecab933' corresponde à Cavalaria
INSERT INTO usuarios (matricula, nome, nome_de_guerra, senha_hash, perfil, posto_graduacao, situacao_cautela, data_ultimo_teste_psicologico, id_quartel)
VALUES 
('1001', 'Cabo João Silva', 'Silva', '5fac61b0fd803321c5831cd12a21649522595554c8a508bd42d4a1b4f09eab36', 'policial', 'Cabo', 'apto', '2026-06-01', '5c4026ec-6c75-408d-8e26-81a13ecab933'),
('1002', 'Soldado Maria Santos', 'Santos', '5fac61b0fd803321c5831cd12a21649522595554c8a508bd42d4a1b4f09eab36', 'policial', 'Soldado', 'apto', '2026-06-02', '5c4026ec-6c75-408d-8e26-81a13ecab933'),
('1003', 'Sargento Carlos Souza', 'Souza', '5fac61b0fd803321c5831cd12a21649522595554c8a508bd42d4a1b4f09eab36', 'policial', 'Sargento', 'apto', '2026-06-03', '5c4026ec-6c75-408d-8e26-81a13ecab933'),
('1004', 'Tenente Ana Costa', 'Costa', '5fac61b0fd803321c5831cd12a21649522595554c8a508bd42d4a1b4f09eab36', 'policial', 'Tenente', 'apto', '2026-06-04', '5c4026ec-6c75-408d-8e26-81a13ecab933')
ON CONFLICT (matricula) DO UPDATE SET
  nome = EXCLUDED.nome,
  nome_de_guerra = EXCLUDED.nome_de_guerra,
  perfil = EXCLUDED.perfil,
  posto_graduacao = EXCLUDED.posto_graduacao,
  situacao_cautela = EXCLUDED.situacao_cautela,
  id_quartel = EXCLUDED.id_quartel;

-- 2. Inserir 7 Equipamentos associados à Cavalaria
INSERT INTO materiais (id_material, id_categoria, modelo, fabricante, calibre, status_atual, data_aquisicao, controle_quantidade, quantidade, id_quartel)
VALUES
-- Armas Curtas (Beretta APX 9mm)
('PMDF-PISTOLA-9MM-001', 'CAT-ARMA-CURTA', 'APX', 'Beretta', '9x19mm', 'disponivel', '2024-01-10', FALSE, NULL, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
('PMDF-PISTOLA-9MM-002', 'CAT-ARMA-CURTA', 'APX', 'Beretta', '9x19mm', 'disponivel', '2024-01-10', FALSE, NULL, '5c4026ec-6c75-408d-8e26-81a13ecab933'),

-- Arma Longa (Fuzil Taurus T4 5.56)
('PMDF-FUZIL-556-001', 'CAT-ARMA-LONGA', 'T4', 'Taurus', '5.56x45mm', 'disponivel', '2023-05-15', FALSE, NULL, '5c4026ec-6c75-408d-8e26-81a13ecab933'),

-- Equipamento de Proteção (Colete Balístico III-A)
('PMDF-COLETE-001', 'CAT-MANUTENCAO', 'Colete Kevlar III-A', 'Glock', NULL, 'disponivel', '2025-02-20', FALSE, NULL, '5c4026ec-6c75-408d-8e26-81a13ecab933'),

-- Equipamento de Comunicação (Rádio HT Motorola)
('PMDF-RADIO-001', 'CAT-COMUNICACAO', 'MTP3550', 'Motorola', NULL, 'disponivel', '2025-03-01', FALSE, NULL, '5c4026ec-6c75-408d-8e26-81a13ecab933'),

-- Munições (com controle de quantidade)
('PMDF-MUNICAO-9MM-BOX-01', 'CAT-MUNICAO', 'Munição 9mm Gold Hex', 'CBC', '9mm', 'disponivel', '2026-01-01', TRUE, 50, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
('PMDF-MUNICAO-556-BOX-01', 'CAT-MUNICAO', 'Munição 5.56mm comum', 'CBC', '5.56mm', 'disponivel', '2026-01-01', TRUE, 100, '5c4026ec-6c75-408d-8e26-81a13ecab933')
ON CONFLICT (id_material) DO UPDATE SET
  id_categoria = EXCLUDED.id_categoria,
  modelo = EXCLUDED.modelo,
  fabricante = EXCLUDED.fabricante,
  calibre = EXCLUDED.calibre,
  status_atual = EXCLUDED.status_atual,
  controle_quantidade = EXCLUDED.controle_quantidade,
  quantidade = EXCLUDED.quantidade,
  id_quartel = EXCLUDED.id_quartel;
