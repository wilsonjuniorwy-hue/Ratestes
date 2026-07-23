-- ====================================================================
-- DIAGNÓSTICO E CORREÇÃO DOS BASTÕES NO SUPABASE
-- Execute no SQL Editor do Supabase (Homologação)
-- ====================================================================

-- 1. Ver TODOS os itens de bastão que existem atualmente no banco
SELECT 
  id_material, 
  id_categoria, 
  modelo, 
  fabricante, 
  controle_quantidade, 
  quantidade, 
  status_atual,
  deletado_em
FROM materiais
WHERE 
  id_categoria = 'CAT-493'
  OR modelo ILIKE 'B%'
  OR modelo ILIKE 'BASTAO%'
  OR modelo ILIKE 'BASTÃO%'
  OR id_material ILIKE 'BASTAO%'
  OR id_material ILIKE 'BASTÃO%'
ORDER BY id_material;

-- 2. Ver a contagem total calculada (o que o sistema está somando)
SELECT 
  COUNT(*) as total_linhas,
  SUM(CASE WHEN controle_quantidade = true THEN quantidade ELSE 1 END) as total_calculado
FROM materiais
WHERE 
  (id_categoria = 'CAT-493'
  OR modelo ILIKE 'B%'
  OR modelo ILIKE 'BASTAO%'
  OR modelo ILIKE 'BASTÃO%'
  OR id_material ILIKE 'BASTAO%'
  OR id_material ILIKE 'BASTÃO%')
  AND deletado_em IS NULL;
