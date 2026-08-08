-- ============================================================
-- SCHEMA COMPLETO DO BANCO DE DADOS: Reserva de Armamento
-- Data: 2026-06-05
-- Execute este script inteiro no SQL Editor do Supabase Staging/Production
-- ============================================================

-- 1. TABELA QUARTEIS
CREATE TABLE IF NOT EXISTS quarteis (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  nome        TEXT NOT NULL,
  ativo       BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMPTZ DEFAULT now(),
  deletado_em TIMESTAMPTZ
);

-- Seed básico do Quartel Cavalaria
INSERT INTO quarteis (slug, nome)
VALUES ('cavalaria', 'Regimento de Cavalaria')
ON CONFLICT (slug) DO NOTHING;

-- 2. TABELA USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  matricula                      TEXT PRIMARY KEY,
  nome                           TEXT NOT NULL,
  nome_de_guerra                 TEXT,
  senha_hash                     TEXT,
  perfil                         TEXT NOT NULL,
  posto_graduacao                TEXT NOT NULL,
  situacao_cautela               TEXT NOT NULL,
  data_ultimo_teste_psicologico  DATE NOT NULL,
  motivo_suspensao               TEXT,
  auth_user_id                   UUID UNIQUE,
  id_quartel                     UUID REFERENCES quarteis(id),
  deletado_em                    TIMESTAMPTZ,
  assinatura_foto                TEXT,
  tentativas_login               INTEGER DEFAULT 0,
  bloqueado_ate                  TIMESTAMPTZ,
  nome_usuario                   TEXT
);

-- 3. TABELA CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
  id_categoria TEXT PRIMARY KEY,
  nome         TEXT NOT NULL,
  descricao    TEXT
);

-- Seed básico de categorias
INSERT INTO categorias (id_categoria, nome, descricao) VALUES
('CAT-ARMA-CURTA', 'Armas de Fogo Curtas', 'Pistolas e Revólveres de porte individual'),
('CAT-ARMA-LONGA', 'Armas de Fogo Longas', 'Fuzis, Carabinas e Espingardas para emprego tático e patrulhamento'),
('CAT-MANUTENCAO', 'Colete Balístico', 'Equipamento de Proteção Individual (EPI) resistente a projéteis'),
('CAT-COMUNICACAO', 'Rádios & Telecomunicações', 'Terminais de rádio transmissor/receptor (HT) criptografados'),
('CAT-MUNICAO', 'Munições', 'Munições operacionais e de treino correspondentes')
ON CONFLICT (id_categoria) DO NOTHING;

-- 4. TABELA MODELOS_ARMAS
CREATE TABLE IF NOT EXISTS modelos_armas (
  modelo  TEXT PRIMARY KEY,
  calibre TEXT NOT NULL
);

-- Seed básico de modelos de armas
INSERT INTO modelos_armas (modelo, calibre) VALUES
('Pistola CZ - P10', '9mm'),
('Fuzil Imbel IA2 5.56', '5.56mm'),
('Espingarda Calibre 12', '12')
ON CONFLICT (modelo) DO NOTHING;

-- 5. TABELA MATERIAIS
CREATE TABLE IF NOT EXISTS materiais (
  id_material             TEXT PRIMARY KEY,
  id_categoria            TEXT REFERENCES categorias(id_categoria),
  modelo                  TEXT NOT NULL,
  fabricante              TEXT NOT NULL,
  calibre                 TEXT,
  status_atual            TEXT NOT NULL,
  data_aquisicao          DATE NOT NULL,
  data_ultima_manutencao  DATE,
  especificacoes_tecnicas TEXT,
  controle_quantidade     BOOLEAN DEFAULT FALSE,
  quantidade              INTEGER,
  id_arma_vinculada       TEXT,
  quantidade_carregadores INTEGER,
  deletado_em             TIMESTAMPTZ
);

-- Seed básico de materiais de apoio (Baterias)
-- NOTA MULTI-QUARTEL: Ao ativar novos quarteis com materiais reais no futuro,
-- certifique-se de executar o seed de baterias (BAT-HYTERA / BAT-SEPURA) para o novo id_quartel.
INSERT INTO materiais (
  id_material, id_categoria, modelo, fabricante, status_atual, data_aquisicao, controle_quantidade, quantidade, id_quartel
) VALUES 
  ('BAT-HYTERA', 'CAT-COMUNICACAO', 'Bateria Hytera', 'Hytera', 'disponivel', CURRENT_DATE, TRUE, 999, (SELECT id FROM quarteis WHERE slug = 'cavalaria' LIMIT 1)),
  ('BAT-SEPURA', 'CAT-COMUNICACAO', 'Bateria Sepura', 'Sepura', 'disponivel', CURRENT_DATE, TRUE, 999, (SELECT id FROM quarteis WHERE slug = 'cavalaria' LIMIT 1))
ON CONFLICT (id_material) DO NOTHING;

-- 6. TABELA CAUTELAS
CREATE TABLE IF NOT EXISTS cautelas (
  id_cautela                    TEXT PRIMARY KEY,
  matricula_policial            TEXT REFERENCES usuarios(matricula),
  matricula_armeiro_retirada    TEXT REFERENCES usuarios(matricula),
  data_retirada                 TIMESTAMPTZ NOT NULL,
  previsao_devolucao            TIMESTAMPTZ NOT NULL,
  data_devolucao_efetiva        TIMESTAMPTZ,
  matricula_armeiro_devolucao   TEXT REFERENCES usuarios(matricula),
  status_cautela                TEXT NOT NULL,
  observacoes_retirada          TEXT,
  observacoes_devolucao         TEXT,
  prorrogada                    BOOLEAN DEFAULT FALSE,
  data_prorrogacao              TIMESTAMPTZ,
  matricula_armeiro_prorrogacao TEXT REFERENCES usuarios(matricula),
  id_quartel                    UUID REFERENCES quarteis(id),
  deletado_em                   TIMESTAMPTZ,
  is_emergencial                BOOLEAN DEFAULT FALSE,
  motivo_emergencial            TEXT
);

-- 7. TABELA CAUTELA_ITENS
CREATE TABLE IF NOT EXISTS cautela_itens (
  id_cautela_item         TEXT PRIMARY KEY,
  id_cautela              TEXT REFERENCES cautelas(id_cautela),
  id_material             TEXT REFERENCES materiais(id_material),
  quantidade              INTEGER NOT NULL DEFAULT 1,
  estado_entrega          TEXT NOT NULL,
  estado_devolucao        TEXT,
  consumido               BOOLEAN DEFAULT FALSE,
  quantidade_carregadores INTEGER,
  id_quartel              UUID REFERENCES quarteis(id),
  deletado_em             TIMESTAMPTZ
);

-- 8. TABELA MANUTENCOES
CREATE TABLE IF NOT EXISTS manutencoes (
  id_manutencao       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_material         TEXT REFERENCES materiais(id_material),
  data_entrada        DATE NOT NULL,
  data_saida_prevista DATE NOT NULL,
  data_saida_efetiva  DATE,
  descricao_problema  TEXT NOT NULL,
  parecer_tecnico     TEXT
);

-- 9. TABELA AUDITORIA_LOGS
CREATE TABLE IF NOT EXISTS auditoria_logs (
  id_log             TEXT PRIMARY KEY,
  data_hora          TIMESTAMPTZ NOT NULL,
  matricula_executor TEXT REFERENCES usuarios(matricula),
  tipo_evento        TEXT NOT NULL,
  detalhes           TEXT,
  id_quartel         UUID REFERENCES quarteis(id),
  deletado_em        TIMESTAMPTZ
);

-- 10. TABELA OCORRENCIAS
CREATE TABLE IF NOT EXISTS ocorrencias (
  id_ocorrencia     TEXT PRIMARY KEY,
  data_hora         TIMESTAMPTZ NOT NULL,
  titulo            TEXT NOT NULL,
  tipo              TEXT NOT NULL,
  descricao         TEXT,
  matricula_armeiro TEXT REFERENCES usuarios(matricula),
  id_quartel        UUID REFERENCES quarteis(id),
  deletado_em       TIMESTAMPTZ
);

-- 11. TABELA ARMAS_PARTICULARES
CREATE TABLE IF NOT EXISTS armas_particulares (
  id_particular      TEXT PRIMARY KEY,
  matricula_policial TEXT REFERENCES usuarios(matricula),
  tipo_item          TEXT NOT NULL,
  modelo             TEXT NOT NULL,
  fabricante         TEXT,
  calibre            TEXT,
  numero_serie       TEXT,
  quantidade         INTEGER NOT NULL DEFAULT 1,
  carregadores       INTEGER,
  data_deposito      TIMESTAMPTZ NOT NULL,
  data_devolucao     TIMESTAMPTZ,
  status             TEXT NOT NULL,
  observacoes        TEXT,
  id_quartel         UUID REFERENCES quarteis(id),
  deletado_em        TIMESTAMPTZ
);

-- 12. TABELA PENDENCIAS_SERVICO
CREATE TABLE IF NOT EXISTS pendencias_servico (
  id_pendencia         TEXT PRIMARY KEY,
  descricao            TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'aberto',
  data_criacao         TIMESTAMPTZ NOT NULL,
  matricula_criador    TEXT REFERENCES usuarios(matricula),
  resolucao            TEXT,
  data_resolucao       TIMESTAMPTZ,
  matricula_resolvedor TEXT REFERENCES usuarios(matricula),
  id_quartel           UUID REFERENCES quarteis(id),
  deletado_em          TIMESTAMPTZ
);

-- 13. TABELA DISPOSITIVOS_AUTORIZADOS
CREATE TABLE IF NOT EXISTS dispositivos_autorizados (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid_hardware    TEXT UNIQUE NOT NULL, -- SHA-256 gerado pelo app desktop
  nome_dispositivo TEXT,
  id_quartel       UUID REFERENCES quarteis(id),
  status           TEXT DEFAULT 'pendente' CHECK (status IN ('ativo', 'pendente', 'suspenso', 'bloqueado')),
  criado_em        TIMESTAMPTZ DEFAULT now(),
  atualizado_em    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SEMENTES DE DADOS: ADMIN E ARMEIRO PADRÃO
-- ============================================================

-- Usuário Admin Especial
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
  '', -- senha cadastrada no primeiro acesso
  'admin',
  'Administrador',
  'apto',
  '2099-12-31',
  NULL
)
ON CONFLICT (matricula) DO UPDATE SET
  perfil = 'admin',
  id_quartel = NULL;

-- Usuário Armeiro Totem
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
  'ARMEIRO',
  'Totem de Atendimento',
  'Totem',
  '5fac61b0fd803321c5831cd12a21649522595554c8a508bd42d4a1b4f09eab36', -- hash de 101187
  'armeiro_gestor',
  'Totem',
  'apto',
  '2026-05-31',
  (SELECT id FROM quarteis WHERE slug = 'cavalaria' LIMIT 1)
)
ON CONFLICT (matricula) DO NOTHING;

-- ============================================================
-- FUNÇÕES DE SEGURANÇA E RLS (POLÍTICOS)
-- ============================================================

CREATE OR REPLACE FUNCTION get_meu_quartel()
RETURNS UUID AS $$
DECLARE
  v_quartel_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT id_quartel INTO v_quartel_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
  RETURN v_quartel_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_meu_perfil()
RETURNS TEXT AS $$
DECLARE
  v_perfil TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT perfil INTO v_perfil FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
  RETURN v_perfil;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_minha_matricula()
RETURNS TEXT AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN upper(split_part(auth.jwt() ->> 'email', '@', 1));
END;
$$ LANGUAGE plpgsql STABLE;


-- JWT CLAIMS HOOK
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
-- VERIFICAÇÃO DE DISPOSITIVOS (HARDWARE PINNING)
-- ============================================================

-- Função para ler o UUID enviado no cabeçalho
CREATE OR REPLACE FUNCTION get_device_uuid_header() RETURNS text AS $$
DECLARE
  v_headers text;
BEGIN
  v_headers := current_setting('request.headers', true);
  IF v_headers IS NULL OR v_headers = '' THEN
    RETURN NULL;
  END IF;
  RETURN v_headers::json->>'x-device-uuid';
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para checar se o dispositivo está autorizado
CREATE OR REPLACE FUNCTION is_current_device_authorized() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM dispositivos_autorizados
    WHERE uuid_hardware = get_device_uuid_header() AND status = 'ativo'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Função SECURITY DEFINER para verificar dispositivo
DROP FUNCTION IF EXISTS verificar_dispositivo(text);

CREATE OR REPLACE FUNCTION verificar_dispositivo(p_uuid TEXT)
RETURNS TABLE (existe BOOLEAN, status TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as existe,
    dispositivos_autorizados.status
  FROM dispositivos_autorizados
  WHERE uuid_hardware = p_uuid;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'inexistente'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HABILITAR RLS E CONFIGURAR POLÍTICAS
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
    is_current_device_authorized()
    OR get_meu_perfil() = 'admin'
    OR id_quartel = get_meu_quartel()
    OR id_quartel IS NULL
    OR matricula = get_minha_matricula()
  )
);
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
CREATE POLICY "usuarios_insert" ON usuarios FOR INSERT WITH CHECK (
  get_meu_perfil() IN ('admin', 'armeiro_gestor')
);
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE USING (
  matricula = get_minha_matricula()
  OR (
    get_meu_perfil() IN ('admin', 'armeiro_gestor')
    AND (get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel())
  )
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
    get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel() OR id_quartel IS NULL
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

-- AUDITORIA_LOGS (append-only imutável)
ALTER TABLE auditoria_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auditoria_select" ON auditoria_logs;
CREATE POLICY "auditoria_select" ON auditoria_logs FOR SELECT USING (
  get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel() OR id_quartel IS NULL
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
    get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel() OR id_quartel IS NULL
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
    get_meu_perfil() = 'admin' OR id_quartel = get_meu_quartel() OR id_quartel IS NULL
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

-- DISPOSITIVOS_AUTORIZADOS (Tauri device pinning)
ALTER TABLE dispositivos_autorizados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dispositivos_admin_all" ON dispositivos_autorizados;
CREATE POLICY "dispositivos_admin_all" ON dispositivos_autorizados FOR ALL USING (
  get_meu_perfil() = 'admin'
);
DROP POLICY IF EXISTS "dispositivos_insert_anon" ON dispositivos_autorizados;
CREATE POLICY "dispositivos_insert_anon" ON dispositivos_autorizados FOR INSERT WITH CHECK (
  status = 'pendente'
);

-- ============================================================
-- TRIGGER: Preenchimento Automático do id_quartel (set_id_quartel_default)
-- ============================================================
CREATE OR REPLACE FUNCTION set_id_quartel_default()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id_quartel IS NULL THEN
    NEW.id_quartel := get_meu_quartel();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cautelas_id_quartel ON cautelas;
CREATE TRIGGER trg_cautelas_id_quartel BEFORE INSERT ON cautelas
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_cautela_itens_id_quartel ON cautela_itens;
CREATE TRIGGER trg_cautela_itens_id_quartel BEFORE INSERT ON cautela_itens
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_materiais_id_quartel ON materiais;
CREATE TRIGGER trg_materiais_id_quartel BEFORE INSERT ON materiais
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_ocorrencias_id_quartel ON ocorrencias;
CREATE TRIGGER trg_ocorrencias_id_quartel BEFORE INSERT ON ocorrencias
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_armas_particulares_id_quartel ON armas_particulares;
CREATE TRIGGER trg_armas_particulares_id_quartel BEFORE INSERT ON armas_particulares
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_pendencias_servico_id_quartel ON pendencias_servico;
CREATE TRIGGER trg_pendencias_servico_id_quartel BEFORE INSERT ON pendencias_servico
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_auditoria_logs_id_quartel ON auditoria_logs;
CREATE TRIGGER trg_auditoria_logs_id_quartel BEFORE INSERT ON auditoria_logs
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_usuarios_id_quartel ON usuarios;
CREATE TRIGGER trg_usuarios_id_quartel BEFORE INSERT ON usuarios
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();


