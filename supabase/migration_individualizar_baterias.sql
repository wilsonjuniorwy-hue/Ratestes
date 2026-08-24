-- ============================================================
-- MIGRATION: Individualização de Baterias nas Cautelas Bélicas
-- Data: 2026-08-24
-- Execute este script no SQL Editor do Supabase (Staging / Production)
-- ============================================================

-- 1. Adicionar coluna individualizar_por_unidade na tabela materiais (se não existir)
ALTER TABLE materiais ADD COLUMN IF NOT EXISTS individualizar_por_unidade BOOLEAN DEFAULT FALSE;

-- 2. Atualizar as baterias existentes para terem a flag individualizar_por_unidade = TRUE
UPDATE materiais 
SET individualizar_por_unidade = TRUE 
WHERE id_material IN ('BAT-HYTERA', 'BAT-SEPURA') 
   OR (id_categoria = 'CAT-COMUNICACAO' AND (modelo ILIKE '%bateria%' OR id_material ILIKE 'BAT-%'));

-- 3. Adicionar coluna criado_em na tabela cautela_itens para ordenação e numeração estáveis
ALTER TABLE cautela_itens ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT now();

-- 4. Preencher criado_em para registros legados que eventualmente estejam nulos
UPDATE cautela_itens 
SET criado_em = now() 
WHERE criado_em IS NULL;
