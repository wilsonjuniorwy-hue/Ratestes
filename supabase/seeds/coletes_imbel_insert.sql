-- ====================================================================
-- INSERÇÃO DOS 5 COLETES IMBEL (TAM M) NA TABELA 'materiais'
-- Execute este script no SQL Editor do Supabase
-- ====================================================================

INSERT INTO materiais (
  id_material, id_categoria, modelo, fabricante, calibre, especificacoes_tecnicas, status_atual, data_aquisicao, controle_quantidade, quantidade, id_quartel
) VALUES
  ('3002093', 'CAT-MANUTENCAO', 'Colete Imbel Tam M', 'IMBEL', '', 'Tamanho M', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('3001989', 'CAT-MANUTENCAO', 'Colete Imbel Tam M', 'IMBEL', '', 'Tamanho M', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('3002090', 'CAT-MANUTENCAO', 'Colete Imbel Tam M', 'IMBEL', '', 'Tamanho M', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('3001993', 'CAT-MANUTENCAO', 'Colete Imbel Tam M', 'IMBEL', '', 'Tamanho M', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('3001991', 'CAT-MANUTENCAO', 'Colete Imbel Tam M', 'IMBEL', '', 'Tamanho M', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933')
ON CONFLICT (id_material) DO UPDATE SET
  modelo = EXCLUDED.modelo,
  fabricante = EXCLUDED.fabricante,
  id_categoria = EXCLUDED.id_categoria,
  especificacoes_tecnicas = EXCLUDED.especificacoes_tecnicas,
  status_atual = EXCLUDED.status_atual,
  id_quartel = EXCLUDED.id_quartel;
