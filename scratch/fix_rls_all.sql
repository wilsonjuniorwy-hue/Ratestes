-- ====================================================================
-- SCRIPT DE AJUSTE DE RLS PARA TODAS AS TABELAS (STAGING / HOMOLOGACAO)
-- Execute este script no SQL Editor do Supabase (Homologação) para
-- criar as políticas que estão faltando.
-- ====================================================================

-- 1. TABELA MATERIAIS
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

-- 2. TABELA CAUTELAS
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

-- 3. TABELA CAUTELA_ITENS
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

-- 4. TABELA OCORRENCIAS
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

-- 5. TABELA AUDITORIA_LOGS
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

-- 6. TABELA ARMAS_PARTICULARES
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

-- 7. TABELA PENDENCIAS_SERVICO
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

-- 8. CATEGORIAS (global)
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categorias_insert" ON categorias;
CREATE POLICY "categorias_insert" ON categorias FOR INSERT WITH CHECK (
  get_meu_perfil() IN ('admin', 'armeiro_gestor')
);
DROP POLICY IF EXISTS "categorias_update" ON categorias;
CREATE POLICY "categorias_update" ON categorias FOR UPDATE USING (
  get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

-- 9. MODELOS_ARMAS (global)
ALTER TABLE modelos_armas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "modelos_insert" ON modelos_armas;
CREATE POLICY "modelos_insert" ON modelos_armas FOR INSERT WITH CHECK (
  get_meu_perfil() IN ('admin', 'armeiro_gestor')
);
