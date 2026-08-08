-- ============================================================
-- MIGRATION: Ajuste de Quantidades Reais de Baterias (Sepura / Hytera)
-- Data: 2026-08-08
-- Execute este script no SQL Editor do Supabase (Staging / Production)
-- ============================================================

-- Ajustar a quantidade real de baterias de Sepura para 52 unidades
UPDATE materiais 
SET quantidade = 52 
WHERE id_material = 'BAT-SEPURA';

-- Ajustar a quantidade real de baterias de Hytera para 29 unidades
UPDATE materiais 
SET quantidade = 29 
WHERE id_material = 'BAT-HYTERA';
