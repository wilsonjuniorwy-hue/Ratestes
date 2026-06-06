-- Adicionar colunas para rastrear tentativas de login e bloqueios temporários
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS tentativas_login INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bloqueado_ate TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Habilitar RLS e garantir que armeiros e policiais consigam ler essas colunas se necessário,
-- mas apenas o sistema (ou RPC) possa atualizá-las de forma segura.
-- Nota: Como o app frontend atualiza a senha e dados usando chaves anon/autenticadas via RLS,
-- certifique-se de que a política RLS permita a atualização das colunas 'tentativas_login' e 'bloqueado_ate' pelo próprio terminal.
