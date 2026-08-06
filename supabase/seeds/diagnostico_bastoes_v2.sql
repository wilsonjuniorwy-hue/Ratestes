-- ====================================================================
-- DIAGNÓSTICO CORRETO - Apenas categoria CAT-493 (Bastão)
-- ====================================================================

-- Ver TODOS os registros reais de bastão (apenas pela categoria)
SELECT 
  id_material, 
  modelo, 
  controle_quantidade, 
  quantidade, 
  status_atual,
  deletado_em
FROM materiais
WHERE id_categoria = 'CAT-493'
AND deletado_em IS NULL
ORDER BY id_material;

-- Contagem correta
SELECT 
  COUNT(*) as total_linhas,
  SUM(CASE WHEN controle_quantidade = true THEN quantidade ELSE 1 END) as total_calculado_correto
FROM materiais
WHERE id_categoria = 'CAT-493'
AND deletado_em IS NULL;

-- ====================================================================
-- CORRECAO: Ajustar o registro de quantidade para 12
-- Descubra o id_material exato na query acima e use abaixo:
-- ====================================================================

-- Mostra todos com controle_quantidade = true (os que somam mais de 1)
SELECT id_material, modelo, quantidade
FROM materiais
WHERE id_categoria = 'CAT-493'
AND controle_quantidade = true
AND deletado_em IS NULL;
