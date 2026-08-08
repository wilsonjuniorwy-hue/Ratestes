-- Migração: Adicionar colunas faltantes em usuarios e cautelas
-- Utiliza sintaxe idempotente (IF NOT EXISTS)

ALTER TABLE usuarios 
  ADD COLUMN IF NOT EXISTS tentativas_login INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bloqueado_ate TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nome_usuario TEXT;

ALTER TABLE cautelas 
  ADD COLUMN IF NOT EXISTS is_emergencial BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS motivo_emergencial TEXT;
