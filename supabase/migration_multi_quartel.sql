-- ============================================================
-- MIGRATION: Sistema Multi-Quartel
-- Data: 2026-06-04
-- Execute este script inteiro no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- PASSO 1: CRIAR TABELA QUARTEIS
-- ============================================================
CREATE TABLE IF NOT EXISTS quarteis (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  nome        TEXT NOT NULL,
  ativo       BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMPTZ DEFAULT now(),
  deletado_em TIMESTAMPTZ
);

-- Seed: quartel atual (Cavalaria)
INSERT INTO quarteis (slug, nome)
VALUES ('cavalaria', 'Regimento de Cavalaria')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PASSO 2: ADICIONAR COLUNAS NAS TABELAS EXISTENTES
-- ============================================================

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS id_quartel UUID REFERENCES quarteis(id),
  ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ;

ALTER TABLE materiais
  ADD COLUMN IF NOT EXISTS id_quartel UUID REFERENCES quarteis(id),
  ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ;

ALTER TABLE cautelas
  ADD COLUMN IF NOT EXISTS id_quartel UUID REFERENCES quarteis(id),
  ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ;

ALTER TABLE cautela_itens
  ADD COLUMN IF NOT EXISTS id_quartel UUID REFERENCES quarteis(id),
  ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ;

ALTER TABLE ocorrencias
  ADD COLUMN IF NOT EXISTS id_quartel UUID REFERENCES quarteis(id),
  ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ;

ALTER TABLE auditoria_logs
  ADD COLUMN IF NOT EXISTS id_quartel UUID REFERENCES quarteis(id),
  ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ;

ALTER TABLE armas_particulares
  ADD COLUMN IF NOT EXISTS id_quartel UUID REFERENCES quarteis(id),
  ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ;

ALTER TABLE pendencias_servico
  ADD COLUMN IF NOT EXISTS id_quartel UUID REFERENCES quarteis(id),
  ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMPTZ;

-- ============================================================
-- PASSO 3: MIGRAR DADOS EXISTENTES PARA O QUARTEL CAVALARIA
-- ============================================================
DO $$
DECLARE
  v_quartel_id UUID;
BEGIN
  SELECT id INTO v_quartel_id FROM quarteis WHERE slug = 'cavalaria';

  -- Migrar todos os usuarios existentes para o quartel Cavalaria
  -- (o usuario ADMIN será criado no Passo 4 já sem id_quartel)
  UPDATE usuarios           SET id_quartel = v_quartel_id WHERE id_quartel IS NULL;
  UPDATE materiais          SET id_quartel = v_quartel_id WHERE id_quartel IS NULL;
  UPDATE cautelas           SET id_quartel = v_quartel_id WHERE id_quartel IS NULL;
  UPDATE cautela_itens      SET id_quartel = v_quartel_id WHERE id_quartel IS NULL;
  UPDATE ocorrencias        SET id_quartel = v_quartel_id WHERE id_quartel IS NULL;
  UPDATE auditoria_logs     SET id_quartel = v_quartel_id WHERE id_quartel IS NULL;
  UPDATE armas_particulares SET id_quartel = v_quartel_id WHERE id_quartel IS NULL;
  UPDATE pendencias_servico SET id_quartel = v_quartel_id WHERE id_quartel IS NULL;
END $$;

-- ============================================================
-- PASSO 4: LIBERAR CAMPO PERFIL PARA ACEITAR 'admin'
-- E CRIAR USUARIO ADMIN SEPARADO
-- ============================================================

-- 4.1: Remover a check constraint que bloqueia o valor 'admin'
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_perfil_check;

-- 4.2: Garantir que o campo perfil é TEXT livre (sem enum restrito)
ALTER TABLE usuarios ALTER COLUMN perfil TYPE TEXT;

-- 4.3: Criar o usuário admin como conta separada
--      Matrícula especial: ADMIN (não vinculada a nenhum policial real)
--      senha_hash vazia = será definida no primeiro acesso
--      auth_user_id vazio = será vinculado no primeiro login
INSERT INTO usuarios (
  matricula,
  nome,
  nome_de_guerra,
  senha_hash,
  perfil,
  posto_graduacao,
  situacao_cautela,
  data_ultimo_teste_psicologico,
  id_quartel
) VALUES (
  'ADMIN',
  'Administrador do Sistema',
  'Admin',
  '',
  'admin',
  'Administrador',
  'apto',
  '2099-12-31',
  NULL   -- Admin não pertence a nenhum quartel
)
ON CONFLICT (matricula) DO UPDATE SET
  perfil = 'admin',
  id_quartel = NULL;


-- ============================================================
-- PASSO 5: FUNCOES AUXILIARES DE RLS
-- ============================================================
CREATE OR REPLACE FUNCTION get_meu_quartel()
RETURNS UUID AS $$
  SELECT id_quartel FROM usuarios
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_meu_perfil()
RETURNS TEXT AS $$
  SELECT perfil FROM usuarios
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- PASSO 6: JWT CLAIMS HOOK
-- ============================================================
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  v_quartel_id uuid;
  v_perfil text;
BEGIN
  SELECT u.id_quartel, u.perfil
  INTO v_quartel_id, v_perfil
  FROM public.usuarios u
  WHERE u.auth_user_id = (event->>'user_id')::uuid;

  claims := event->'claims';
  claims := jsonb_set(claims, '{quartel_id}', COALESCE(to_jsonb(v_quartel_id), 'null'::jsonb));
  claims := jsonb_set(claims, '{perfil}',     COALESCE(to_jsonb(v_perfil),     'null'::jsonb));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- ============================================================
-- PASSO 7: HABILITAR RLS E POLITICAS
-- ============================================================

-- QUARTEIS
ALTER TABLE quarteis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quarteis_select" ON quarteis;
CREATE POLICY "quarteis_select" ON quarteis FOR SELECT USING (deletado_em IS NULL);
DROP POLICY IF EXISTS "quarteis_insert" ON quarteis;
CREATE POLICY "quarteis_insert" ON quarteis FOR INSERT WITH CHECK (get_meu_perfil() = 'admin');
DROP POLICY IF EXISTS "quarteis_update" ON quarteis;
CREATE POLICY "quarteis_update" ON quarteis FOR UPDATE USING (get_meu_perfil() = 'admin');

-- USUARIOS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
CREATE POLICY "usuarios_select" ON usuarios FOR SELECT USING (
  deletado_em IS NULL AND (
    get_meu_perfil() = 'admin'
    OR id_quartel = get_meu_quartel()
    OR matricula = (SELECT matricula FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1)
  )
);
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
CREATE POLICY "usuarios_insert" ON usuarios FOR INSERT WITH CHECK (
  get_meu_perfil() IN ('admin', 'armeiro_gestor')
);
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE USING (
  get_meu_perfil() IN ('admin', 'armeiro_gestor')
  AND (get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel())
);

-- MATERIAIS
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "materiais_select" ON materiais;
CREATE POLICY "materiais_select" ON materiais FOR SELECT USING (
  deletado_em IS NULL AND (
    get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel()
  )
);
DROP POLICY IF EXISTS "materiais_insert" ON materiais;
CREATE POLICY "materiais_insert" ON materiais FOR INSERT WITH CHECK (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);
DROP POLICY IF EXISTS "materiais_update" ON materiais;
CREATE POLICY "materiais_update" ON materiais FOR UPDATE USING (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);

-- CAUTELAS
ALTER TABLE cautelas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cautelas_select" ON cautelas;
CREATE POLICY "cautelas_select" ON cautelas FOR SELECT USING (
  deletado_em IS NULL AND (
    get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel()
  )
);
DROP POLICY IF EXISTS "cautelas_insert" ON cautelas;
CREATE POLICY "cautelas_insert" ON cautelas FOR INSERT WITH CHECK (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);
DROP POLICY IF EXISTS "cautelas_update" ON cautelas;
CREATE POLICY "cautelas_update" ON cautelas FOR UPDATE USING (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);

-- CAUTELA_ITENS
ALTER TABLE cautela_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cautela_itens_select" ON cautela_itens;
CREATE POLICY "cautela_itens_select" ON cautela_itens FOR SELECT USING (
  deletado_em IS NULL AND (
    get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel()
  )
);
DROP POLICY IF EXISTS "cautela_itens_insert" ON cautela_itens;
CREATE POLICY "cautela_itens_insert" ON cautela_itens FOR INSERT WITH CHECK (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);
DROP POLICY IF EXISTS "cautela_itens_update" ON cautela_itens;
CREATE POLICY "cautela_itens_update" ON cautela_itens FOR UPDATE USING (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);

-- OCORRENCIAS
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ocorrencias_select" ON ocorrencias;
CREATE POLICY "ocorrencias_select" ON ocorrencias FOR SELECT USING (
  deletado_em IS NULL AND (
    get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel()
  )
);
DROP POLICY IF EXISTS "ocorrencias_insert" ON ocorrencias;
CREATE POLICY "ocorrencias_insert" ON ocorrencias FOR INSERT WITH CHECK (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);
DROP POLICY IF EXISTS "ocorrencias_update" ON ocorrencias;
CREATE POLICY "ocorrencias_update" ON ocorrencias FOR UPDATE USING (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);

-- AUDITORIA_LOGS (append-only imutavel)
ALTER TABLE auditoria_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auditoria_select" ON auditoria_logs;
CREATE POLICY "auditoria_select" ON auditoria_logs FOR SELECT USING (
  get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel()
);
DROP POLICY IF EXISTS "auditoria_insert" ON auditoria_logs;
CREATE POLICY "auditoria_insert" ON auditoria_logs FOR INSERT WITH CHECK (
  get_meu_perfil() IN ('admin', 'armeiro_gestor')
  AND (get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel())
);
DROP RULE IF EXISTS auditoria_no_update ON auditoria_logs;
CREATE RULE auditoria_no_update AS ON UPDATE TO auditoria_logs DO INSTEAD NOTHING;
DROP RULE IF EXISTS auditoria_no_delete ON auditoria_logs;
CREATE RULE auditoria_no_delete AS ON DELETE TO auditoria_logs DO INSTEAD NOTHING;

-- ARMAS_PARTICULARES
ALTER TABLE armas_particulares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "armas_particulares_select" ON armas_particulares;
CREATE POLICY "armas_particulares_select" ON armas_particulares FOR SELECT USING (
  deletado_em IS NULL AND (
    get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel()
  )
);
DROP POLICY IF EXISTS "armas_particulares_insert" ON armas_particulares;
CREATE POLICY "armas_particulares_insert" ON armas_particulares FOR INSERT WITH CHECK (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);
DROP POLICY IF EXISTS "armas_particulares_update" ON armas_particulares;
CREATE POLICY "armas_particulares_update" ON armas_particulares FOR UPDATE USING (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);

-- PENDENCIAS_SERVICO
ALTER TABLE pendencias_servico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pendencias_select" ON pendencias_servico;
CREATE POLICY "pendencias_select" ON pendencias_servico FOR SELECT USING (
  deletado_em IS NULL AND (
    get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel()
  )
);
DROP POLICY IF EXISTS "pendencias_insert" ON pendencias_servico;
CREATE POLICY "pendencias_insert" ON pendencias_servico FOR INSERT WITH CHECK (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);
DROP POLICY IF EXISTS "pendencias_update" ON pendencias_servico;
CREATE POLICY "pendencias_update" ON pendencias_servico FOR UPDATE USING (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);

-- CATEGORIAS (global)
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categorias_select" ON categorias;
CREATE POLICY "categorias_select" ON categorias FOR SELECT USING (true);
DROP POLICY IF EXISTS "categorias_insert" ON categorias;
CREATE POLICY "categorias_insert" ON categorias FOR INSERT WITH CHECK (
  get_meu_perfil() IN ('admin', 'armeiro_gestor')
);
DROP POLICY IF EXISTS "categorias_update" ON categorias;
CREATE POLICY "categorias_update" ON categorias FOR UPDATE USING (
  get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

-- MODELOS_ARMAS (global)
ALTER TABLE modelos_armas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "modelos_select" ON modelos_armas;
CREATE POLICY "modelos_select" ON modelos_armas FOR SELECT USING (true);
DROP POLICY IF EXISTS "modelos_insert" ON modelos_armas;
CREATE POLICY "modelos_insert" ON modelos_armas FOR INSERT WITH CHECK (
  get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

-- ============================================================
-- FIM
-- ============================================================
SELECT 'Migration multi-quartel executada com sucesso!' AS status;
