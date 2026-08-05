-- ====================================================================
-- SCRIPT DE CORREÇÃO DE RLS PARA CAUTELAS, CAUTELA_ITENS E MATERIAIS
-- Execute este script no SQL Editor do seu projeto Supabase
-- ====================================================================

-- 1. TABELA CAUTELAS
ALTER TABLE cautelas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cautelas_select" ON cautelas;
CREATE POLICY "cautelas_select" ON cautelas FOR SELECT USING (
  deletado_em IS NULL AND (
    is_current_device_authorized()
    OR get_meu_perfil() = 'admin'
    OR id_quartel = get_meu_quartel()
    OR id_quartel IS NULL
  )
);

DROP POLICY IF EXISTS "cautelas_insert" ON cautelas;
CREATE POLICY "cautelas_insert" ON cautelas FOR INSERT WITH CHECK (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

DROP POLICY IF EXISTS "cautelas_update" ON cautelas;
CREATE POLICY "cautelas_update" ON cautelas FOR UPDATE USING (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

-- 2. TABELA CAUTELA_ITENS
ALTER TABLE cautela_itens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cautela_itens_select" ON cautela_itens;
CREATE POLICY "cautela_itens_select" ON cautela_itens FOR SELECT USING (
  deletado_em IS NULL AND (
    is_current_device_authorized()
    OR get_meu_perfil() = 'admin'
    OR id_quartel = get_meu_quartel()
    OR id_quartel IS NULL
  )
);

DROP POLICY IF EXISTS "cautela_itens_insert" ON cautela_itens;
CREATE POLICY "cautela_itens_insert" ON cautela_itens FOR INSERT WITH CHECK (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

DROP POLICY IF EXISTS "cautela_itens_update" ON cautela_itens;
CREATE POLICY "cautela_itens_update" ON cautela_itens FOR UPDATE USING (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

-- 3. TABELA MATERIAIS
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "materiais_select" ON materiais;
CREATE POLICY "materiais_select" ON materiais FOR SELECT USING (
  deletado_em IS NULL AND (
    is_current_device_authorized()
    OR get_meu_perfil() = 'admin'
    OR id_quartel = get_meu_quartel()
    OR id_quartel IS NULL
  )
);

DROP POLICY IF EXISTS "materiais_insert" ON materiais;
CREATE POLICY "materiais_insert" ON materiais FOR INSERT WITH CHECK (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

DROP POLICY IF EXISTS "materiais_update" ON materiais;
CREATE POLICY "materiais_update" ON materiais FOR UPDATE USING (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);
