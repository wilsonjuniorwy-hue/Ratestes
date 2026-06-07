-- =====================================================================
-- SCRIPT DE CORREÇÃO E LIMPEZA: VINCULAR CONTAS E REMOVER EXCLUÍDOS
-- =====================================================================
-- Use este script no Editor SQL do Painel do Supabase. Ele realiza duas tarefas:
-- 1. Vincula o 'auth_user_id' e define senha padrão para usuários ativos.
-- 2. Remove da tabela public.usuarios os armeiros/admins antigos que já foram
--    excluídos do painel do Supabase Auth (evitando que peçam senha no login).

-- ---------------------------------------------------------------------
-- PARTE 1: LIMPEZA DE USUÁRIOS FANTASMAS (EXCLUÍDOS DO SUPABASE AUTH)
-- ---------------------------------------------------------------------

-- A. Excluir admins cujo e-mail não existe no Supabase Auth (auth.users)
DELETE FROM public.usuarios u
WHERE u.perfil = 'admin'
  AND u.matricula NOT IN ('ADMIN') -- Protege o administrador principal
  AND (LOWER(u.matricula) || '@admin.pm') NOT IN (SELECT email FROM auth.users);

-- B. Excluir armeiros cujo e-mail não existe no Supabase Auth (auth.users)
DELETE FROM public.usuarios u
WHERE u.perfil = 'armeiro_gestor'
  AND u.matricula NOT IN ('ARMEIRO') -- Protege o armeiro/totem padrão
  AND u.id_quartel IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM auth.users au 
    JOIN public.quarteis q ON q.id = u.id_quartel
    WHERE au.email = LOWER(u.matricula) || '@' || LOWER(q.slug) || '.pm'
  );

-- ---------------------------------------------------------------------
-- PARTE 2: VINCULAÇÃO E RESTAURAÇÃO DE CONTAS ATIVAS
-- ---------------------------------------------------------------------

-- A. Vincular Administradores ativos
UPDATE public.usuarios u
SET auth_user_id = au.id
FROM auth.users au
WHERE au.email = LOWER(u.matricula) || '@admin.pm'
  AND u.perfil = 'admin';

-- B. Vincular Armeiros ativos
UPDATE public.usuarios u
SET auth_user_id = au.id
FROM auth.users au, public.quarteis q
WHERE u.id_quartel = q.id
  AND au.email = LOWER(u.matricula) || '@' || LOWER(q.slug) || '.pm'
  AND u.perfil = 'armeiro_gestor';

-- C. Definir Hash de Senha Padrão (PIN '101187') para quem está sem PIN
UPDATE public.usuarios
SET senha_hash = '5fac61b0fd803321c5831cd12a21649522595554c8a508bd42d4a1b4f09eab36'
WHERE (senha_hash = '' OR senha_hash IS NULL);
