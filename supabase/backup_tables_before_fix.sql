-- ============================================================
-- SCRIPT DE BACKUP PREVENTIVO (PASSO 1)
-- Data: 2026-08-12
-- Execute este script no SQL Editor do Supabase antes de qualquer UPDATE
-- ============================================================

-- 1. Backup da tabela materiais
CREATE TABLE IF NOT EXISTS materiais_backup_20260812 AS SELECT * FROM materiais;
ALTER TABLE materiais_backup_20260812 DISABLE ROW LEVEL SECURITY;

-- 2. Backup da tabela cautelas
CREATE TABLE IF NOT EXISTS cautelas_backup_20260812 AS SELECT * FROM cautelas;
ALTER TABLE cautelas_backup_20260812 DISABLE ROW LEVEL SECURITY;

-- 3. Backup da tabela cautela_itens
CREATE TABLE IF NOT EXISTS cautela_itens_backup_20260812 AS SELECT * FROM cautela_itens;
ALTER TABLE cautela_itens_backup_20260812 DISABLE ROW LEVEL SECURITY;

-- 4. Backup da tabela usuarios
CREATE TABLE IF NOT EXISTS usuarios_backup_20260812 AS SELECT * FROM usuarios;
ALTER TABLE usuarios_backup_20260812 DISABLE ROW LEVEL SECURITY;

-- Confirmar contagens dos backups criados
SELECT 'materiais_backup_20260812' AS tabela, COUNT(*) AS total_registros FROM materiais_backup_20260812
UNION ALL
SELECT 'cautelas_backup_20260812', COUNT(*) FROM cautelas_backup_20260812
UNION ALL
SELECT 'cautela_itens_backup_20260812', COUNT(*) FROM cautela_itens_backup_20260812
UNION ALL
SELECT 'usuarios_backup_20260812', COUNT(*) FROM usuarios_backup_20260812;
