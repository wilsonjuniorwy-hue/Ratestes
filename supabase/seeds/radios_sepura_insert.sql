-- ====================================================================
-- INSERÇÃO DOS 19 RÁDIOS SEPURA NA TABELA 'materiais'
-- Execute este script no SQL Editor do Supabase
-- ====================================================================

INSERT INTO materiais (
  id_material, id_categoria, modelo, fabricante, calibre, status_atual, data_aquisicao, controle_quantidade, quantidade, id_quartel
) VALUES
  ('03600.216.276', 'CAT-COMUNICACAO', 'SEP216.276', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.278', 'CAT-COMUNICACAO', 'SEP216.278', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.284', 'CAT-COMUNICACAO', 'SEP216.284', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.283', 'CAT-COMUNICACAO', 'SEP216.283', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.286', 'CAT-COMUNICACAO', 'SEP216.286', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.253', 'CAT-COMUNICACAO', 'SEP216.253', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.246', 'CAT-COMUNICACAO', 'SEP216.246', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.266', 'CAT-COMUNICACAO', 'SEP216.266', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.275', 'CAT-COMUNICACAO', 'SEP216.275', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.249', 'CAT-COMUNICACAO', 'SEP216.249', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.260', 'CAT-COMUNICACAO', 'SEP216.260', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.254', 'CAT-COMUNICACAO', 'SEP216.254', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.279', 'CAT-COMUNICACAO', 'SEP216.279', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.250', 'CAT-COMUNICACAO', 'SEP216.250', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.271', 'CAT-COMUNICACAO', 'SEP216.271', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.245', 'CAT-COMUNICACAO', 'SEP216.245', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.273', 'CAT-COMUNICACAO', 'SEP216.273', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.252', 'CAT-COMUNICACAO', 'SEP216.252', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.216.265', 'CAT-COMUNICACAO', 'SEP216.265', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933')
ON CONFLICT (id_material) DO UPDATE SET
  modelo = EXCLUDED.modelo,
  fabricante = EXCLUDED.fabricante,
  id_categoria = EXCLUDED.id_categoria,
  status_atual = EXCLUDED.status_atual,
  id_quartel = EXCLUDED.id_quartel;
