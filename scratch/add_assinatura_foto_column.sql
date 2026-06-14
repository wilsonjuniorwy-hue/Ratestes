-- Adicionar coluna para armazenar a assinatura digitalizada (base64) do armeiro
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS assinatura_foto TEXT DEFAULT NULL;
