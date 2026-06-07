-- ============================================================
-- SCRIPT DE AJUSTE DE RLS PARA FILA DE SINCRONIZAÇÃO OFFLINE (V4)
-- Execute este script no SQL Editor do seu console Supabase.
-- ============================================================

-- 1. Permitir que Armeiros Gestores excluam itens de cautela do seu próprio quartel
-- (Necessário para a devolução/baixa de material offline e online)
DROP POLICY IF EXISTS "cautela_itens_delete" ON cautela_itens;
CREATE POLICY "cautela_itens_delete" ON cautela_itens FOR DELETE USING (
  get_meu_perfil() = 'admin'
  OR (get_meu_perfil() = 'armeiro_gestor' AND id_quartel = get_meu_quartel())
);

-- 2. Permitir que Armeiros Gestores reativem/atualizem usuários marcados como deletados
-- (Evita erro de chave primária duplicada no cadastro de policiais previamente excluídos)
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE USING (
  matricula = get_minha_matricula()
  OR (
    get_meu_perfil() IN ('admin', 'armeiro_gestor')
    AND (
      get_meu_perfil() = 'admin' 
      OR id_quartel = get_meu_quartel()
      OR deletado_em IS NOT NULL
    )
  )
);

SELECT 'Políticas RLS atualizadas com sucesso!' AS status;
