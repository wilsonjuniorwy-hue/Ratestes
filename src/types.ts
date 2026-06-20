/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Perfis de Acesso ---
export type PerfilUsuario = 'policial' | 'armeiro_gestor' | 'admin';

// --- Quartel (Unidade Militar) ---
export interface Quartel {
  id: string;          // UUID
  slug: string;        // ex: 'cavalaria', 'batalhao-infantaria'
  nome: string;        // ex: 'Regimento de Cavalaria'
  ativo: boolean;
  criado_em: string;   // ISO DateTime
  deletado_em?: string; // soft delete
}

// --- Situação do Militar para Cautela ---
export type SituacaoMilitar = 'apto' | 'suspenso' | 'pendente_devolucao' | 'restrito_servico';

// --- Status de Inventário do Material ---
export type StatusMaterial = 'disponivel' | 'cautelado' | 'manutencao' | 'condenado' | 'indisponivel' | 'danificado' | 'retirado';

// --- Condição de Conservação do Item ---
export type CondicaoUso = 'excelente' | 'bom' | 'regular' | 'avariado';

// --- Status da Cautela ---
export type StatusCautela = 'ativa' | 'devolvida' | 'atrasada' | 'prorrogada' | 'permanente';

export interface Usuario {
  matricula: string; // Chave Primária (Ex: PM-874291)
  nome: string;
  nome_de_guerra?: string; // Nome de guerra (ex: Silva)
  senha_hash: string; // Simulação de segurança
  perfil: PerfilUsuario;
  posto_graduacao: string; // Ex: Soldado, Cabo, Sargento, Subtenente, Tenente, Capitão, Major
  situacao_cautela: SituacaoMilitar;
  data_ultimo_teste_psicologico: string; // ISO Date (Validade anual)
  motivo_suspensao?: string;
  auth_user_id?: string;
  id_quartel?: string;   // UUID do quartel — null/undefined para admin
  deletado_em?: string;  // Soft delete (ISO DateTime)
  tentativas_login?: number;
  bloqueado_ate?: string | null;
  assinatura_foto?: string | null;
}

export interface Categoria {
  id_categoria: string; // Chave Primária
  nome: string; // Ex: Pistola, Fuzil, Colete Balístico, Rádio HT, Munições
  descricao: string;
}

export interface Material {
  id_material: string; // Chave Primária - Número de Série/RFID (Ex: SFK54029)
  id_categoria: string; // Chave Estrangeira
  modelo: string; // Ex: Taurus TS9, Taurus T4, Colete Kevlar Nivel III, Harris Falcon III
  fabricante: string; // Ex: Taurus, Imbel, CBC, Motorola, Harris
  calibre?: string; // Ex: 9mm, .40 S&W, 5.56x45mm (nulo para colete/rádio)
  status_atual: StatusMaterial;
  data_aquisicao: string;
  data_ultima_manutencao?: string;
  especificacoes_tecnicas: string;
  controle_quantidade?: boolean; // Se true, o controle é por lote/quantidade
  quantidade?: number; // Quantidade total em estoque
  id_arma_vinculada?: string; // ID/Código da arma vinculada
  quantidade_carregadores?: number; // Quantidade de carregadores desta arma
  id_quartel?: string;   // UUID do quartel
  data_validade?: string; // Data de validade do item (ex: YYYY-MM-DD)
}

export interface Cautela {
  id_cautela: string; // Chave Primária (UUID)
  matricula_policial: string; // Chave Estrangeira -> Usuario(matricula)
  matricula_armeiro_retirada: string; // Chave Estrangeira -> Usuario(matricula) do Armeiro de serviço
  data_retirada: string; // ISO DateTime
  previsao_devolucao: string; // ISO DateTime
  data_devolucao_efetiva?: string; // ISO DateTime
  matricula_armeiro_devolucao?: string; // Chave Estrangeira -> Usuario(matricula) que recebeu
  status_cautela: StatusCautela;
  observacoes_retirada: string;
  observacoes_devolucao?: string;
  // Campos de prorrogação (dotação estendida > 24h)
  prorrogada?: boolean; // true quando o armeiro autorizou prorrogação
  data_prorrogacao?: string; // ISO DateTime do momento em que foi prorrogada
  matricula_armeiro_prorrogacao?: string; // Armeiro que autorizou a prorrogação
  id_quartel?: string;   // UUID do quartel
}

export interface CautelaItem {
  id_cautela_item: string; // Chave Primária (UUID)
  id_cautela: string; // Chave Estrangeira -> Cautela(id_cautela)
  id_material: string; // Chave Estrangeira -> Material(id_material)
  quantidade: number; // Geralmente 1 para itens com número de série, ou quantidade de cartuchos
  estado_entrega: CondicaoUso;
  estado_devolucao?: CondicaoUso;
  consumido?: boolean;
  quantidade_carregadores?: number; // Quantidade de carregadores retirados com a arma
  id_quartel?: string;             // UUID do quartel
}

export interface Manutencao {
  id_manutencao: string; // Chave Primária (UUID)
  id_material: string; // Chave Estrangeira -> Material(id_material)
  data_entrada: string;
  data_saida_prevista: string;
  data_saida_efetiva?: string;
  descricao_problema: string;
  parecer_tecnico?: string;
}

export interface AuditoriaLog {
  id_log: string; // Chave Primária (UUID)
  data_hora: string;
  matricula_executor: string; // Chave Estrangeira -> Usuario(matricula)
  tipo_evento: 'login' | 'registro_cautela' | 'registro_devolucao' | 'bloqueio_militar' | 'envio_manutencao' | 'retorno_manutencao' | 'cadastro_militar';
  detalhes: string;
  id_quartel?: string;   // UUID do quartel
}

export interface OcorrenciaRelatorio {
  id_ocorrencia: string; // Chave Primária (Ex: OCO-482910)
  data_hora: string; // ISO DateTime
  titulo: string;
  tipo: 'troca_turno' | 'avaria_material' | 'fiscalizacao' | 'outros' | 'conferencia_estoque';
  descricao: string;
  matricula_armeiro: string; // Autor do registro
  id_quartel?: string;   // UUID do quartel
}

export interface ArmaParticular {
  id_particular: string; // Chave Primária (UUID)
  matricula_policial: string; // Chave Estrangeira -> Usuario(matricula)
  tipo_item: 'arma' | 'colete' | 'municao';
  modelo: string;
  fabricante?: string;
  calibre?: string;
  numero_serie?: string;
  quantidade: number;
  carregadores?: number;
  data_deposito: string; // ISO DateTime
  data_devolucao?: string; // ISO DateTime
  status: 'guardado' | 'devolvido';
  observacoes?: string;
  id_quartel?: string;   // Vinculação com o quartel
}

export interface PendenciaServico {
  id_pendencia: string; // Chave Primária (UUID)
  descricao: string;
  status: 'aberto' | 'resolvido';
  data_criacao: string; // ISO DateTime
  matricula_criador: string;
  resolucao?: string;
  data_resolucao?: string; // ISO DateTime
  matricula_resolvedor?: string;
  id_quartel?: string;   // Vinculação com o quartel
}


