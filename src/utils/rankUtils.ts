export const POSTOS_GRADUACOES_EXTENSO = [
  'Soldado',
  'Cabo',
  'Sargento',
  'Subtenente',
  'Tenente',
  'Capitão',
  'Major',
  'Tenente-Coronel',
  'Coronel',
  'Civil'
] as const;

export const POSTOS_GRADUACOES_SIGLAS = [
  'SD',
  'CB',
  'SGT',
  'ST',
  'TEN',
  'CAP',
  'MAJ',
  'TC',
  'CEL',
  'CIVIL'
] as const;

/**
 * Converte qualquer string de Posto/Graduação para a sigla oficial em maiúsculas.
 * Exemplo: "Soldado" -> "SD", "2º Sargento" -> "SGT", "Cabo" -> "CB", "Civil" -> "CIVIL"
 */
export function formatPostoGraduacaoSigla(posto?: string | null): string {
  if (!posto) return '';
  const clean = posto.trim();
  if (!clean) return '';

  const upper = clean.toUpperCase();

  // Se já for uma sigla exata
  if (POSTOS_GRADUACOES_SIGLAS.includes(upper as any)) {
    return upper;
  }

  // Verificação por padrões/termos
  if (upper.includes('CIVIL')) return 'CIVIL';
  if (upper.includes('SOLDADO') || upper === 'SD') return 'SD';
  if (upper.includes('CABO') || upper === 'CB') return 'CB';
  if (upper.includes('SARGENTO') || upper.includes('SGT')) return 'SGT';
  if (upper.includes('SUBTENENTE') || upper === 'ST') return 'ST';
  if (upper.includes('TENENTE-CORONEL') || upper === 'TC') return 'TC';
  if (upper.includes('CORONEL') || upper === 'CEL') return 'CEL';
  if (upper.includes('TENENTE') || upper.includes('TEN')) return 'TEN';
  if (upper.includes('CAPITÃO') || upper.includes('CAPITAO') || upper === 'CAP') return 'CAP';
  if (upper.includes('MAJOR') || upper === 'MAJ') return 'MAJ';

  return upper;
}

/**
 * Normaliza qualquer sigla ou string de posto para o nome padrão por extenso.
 * Exemplo: "SD" -> "Soldado", "SGT" -> "Sargento", "CB" -> "Cabo"
 */
export function normalizarPostoExtenso(posto?: string | null): string {
  if (!posto) return 'Soldado';
  const sigla = formatPostoGraduacaoSigla(posto);
  switch (sigla) {
    case 'SD': return 'Soldado';
    case 'CB': return 'Cabo';
    case 'SGT': return 'Sargento';
    case 'ST': return 'Subtenente';
    case 'TEN': return 'Tenente';
    case 'CAP': return 'Capitão';
    case 'MAJ': return 'Major';
    case 'TC': return 'Tenente-Coronel';
    case 'CEL': return 'Coronel';
    case 'CIVIL': return 'Civil';
    default:
      // Se já estiver por extenso na lista, mantém
      const found = POSTOS_GRADUACOES_EXTENSO.find(p => p.toLowerCase() === posto.trim().toLowerCase());
      return found || posto;
  }
}
