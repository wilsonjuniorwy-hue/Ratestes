-- ====================================================================
-- INSERÇÃO DOS 15 COLETES PROTECOP (TAM G) NA TABELA 'materiais'
-- Execute este script no SQL Editor do Supabase
-- ====================================================================

INSERT INTO materiais (
  id_material, id_categoria, modelo, fabricante, calibre, especificacoes_tecnicas, status_atual, data_aquisicao, controle_quantidade, quantidade, id_quartel
) VALUES
  ('SC00001230400140005971', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC00001230400140005431', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC00001230400140007601', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC00001230400140002011', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC00001230400140002021', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC00001230400140005511', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC0000xxxxxxxxxxxxx5871', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC00001230400140005821', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC00001230400140006601', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC00001230400140005481', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SCxxxxxxxxxxxxxxxxxxxx', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC00001230400140005931', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC00001230400140005501', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC00001230400140005491', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('SC0000123040014000762', 'CAT-MANUTENCAO', 'Colete Protecop Tam G', 'PROTECOP', '', 'Tamanho G', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933')
ON CONFLICT (id_material) DO UPDATE SET
  modelo = EXCLUDED.modelo,
  fabricante = EXCLUDED.fabricante,
  id_categoria = EXCLUDED.id_categoria,
  especificacoes_tecnicas = EXCLUDED.especificacoes_tecnicas,
  status_atual = EXCLUDED.status_atual,
  id_quartel = EXCLUDED.id_quartel;
