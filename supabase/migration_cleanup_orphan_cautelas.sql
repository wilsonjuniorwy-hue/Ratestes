-- ============================================================
-- MIGRATION: Limpeza e Encerramento de Cautelas Órfãs (Sem Itens)
-- Data: 2026-08-08
-- Execute este script no SQL Editor do Supabase (Staging / Production)
-- ============================================================

-- 1. Encerrar cautelas órfãs sem equipamentos associados
UPDATE cautelas
SET status_cautela = 'devolvida',
    data_devolucao_efetiva = NOW(),
    observacoes_devolucao = 'Baixa de regularização: Cautela órfã de testes anteriores sem equipamentos associados'
WHERE id_cautela IN (
  SELECT c.id_cautela
  FROM cautelas c
  LEFT JOIN cautela_itens ci ON c.id_cautela = ci.id_cautela
  WHERE c.status_cautela IN ('ativa', 'atrasada', 'prorrogada')
  GROUP BY c.id_cautela
  HAVING COUNT(ci.id_cautela_item) = 0
);

-- 2. Reabilitar a situação dos policiais afetados para 'apto'
UPDATE usuarios
SET situacao_cautela = 'apto'
WHERE matricula IN (
  SELECT u.matricula
  FROM usuarios u
  WHERE u.situacao_cautela = 'pendente_devolucao'
    AND NOT EXISTS (
      SELECT 1 FROM cautelas c
      WHERE c.matricula_policial = u.matricula
        AND c.status_cautela IN ('ativa', 'atrasada', 'prorrogada')
    )
);
