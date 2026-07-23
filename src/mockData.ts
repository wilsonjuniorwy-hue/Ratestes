/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Usuario, Categoria, Material, Cautela, CautelaItem, Manutencao, AuditoriaLog, OcorrenciaRelatorio } from './types';

export const mockUsuarios: Usuario[] = [
  {
    matricula: '1',
    nome: 'Operador Teste',
    nome_de_guerra: 'Operador',
    senha_hash: '1',
    perfil: 'policial',
    posto_graduacao: 'Cabo',
    situacao_cautela: 'apto',
    data_ultimo_teste_psicologico: '2026-04-01',
  },
  {
    matricula: 'PM-111111',
    nome: 'Soldado Lucas Silva',
    nome_de_guerra: 'Lucas Silva',
    senha_hash: '',
    perfil: 'policial',
    posto_graduacao: 'Soldado',
    situacao_cautela: 'apto',
    data_ultimo_teste_psicologico: '2026-03-10',
  },
  {
    matricula: 'PM-222222',
    nome: 'Cabo Aline Costa',
    nome_de_guerra: 'Aline',
    senha_hash: '',
    perfil: 'policial',
    posto_graduacao: 'Cabo',
    situacao_cautela: 'apto',
    data_ultimo_teste_psicologico: '2026-05-15',
  },
  {
    matricula: 'PM-921384',
    nome: 'Carlos Eduardo Souza',
    nome_de_guerra: 'Carlos Eduardo',
    senha_hash: '123456',
    perfil: 'policial',
    posto_graduacao: 'Cabo',
    situacao_cautela: 'apto',
    data_ultimo_teste_psicologico: '2026-02-15', // Teste válido
  },
  {
    matricula: 'PM-734891',
    nome: 'Juliana Mendes Santos',
    nome_de_guerra: 'Juliana',
    senha_hash: '123456',
    perfil: 'policial',
    posto_graduacao: 'Soldado',
    situacao_cautela: 'apto',
    data_ultimo_teste_psicologico: '2025-11-10', // Válido
  },
  {
    matricula: 'PM-510294',
    nome: 'Sargento Marcos Aurélio',
    nome_de_guerra: 'Sgt Marcos',
    senha_hash: '123456',
    perfil: 'policial',
    posto_graduacao: 'Sargento',
    situacao_cautela: 'pendente_devolucao',
    data_ultimo_teste_psicologico: '2025-08-20',
    motivo_suspensao: 'Possui cautela atrasada há mais de 48 horas (Rádio HT).'
  },
  {
    matricula: 'PM-289410',
    nome: 'Rodrigo Alencar Lima',
    nome_de_guerra: 'Rodrigo',
    senha_hash: '123456',
    perfil: 'policial',
    posto_graduacao: 'Cabo',
    situacao_cautela: 'suspenso',
    data_ultimo_teste_psicologico: '2025-03-01', // Vencido (mais de 1 ano de intervalo em 31/05/2026)
    motivo_suspensao: 'Avaliação psicológica anual vencida ou inapta técnica temporária.'
  },
  {
    matricula: 'PM-881290',
    nome: 'Major Wellington Silva',
    nome_de_guerra: 'Wellington',
    senha_hash: '123456',
    perfil: 'policial',
    posto_graduacao: 'Major',
    situacao_cautela: 'apto',
    data_ultimo_teste_psicologico: '2026-04-10',
  },
  {
    matricula: 'ARM-00123',
    nome: 'Sargento Roberto Dias (Armeiro)',
    nome_de_guerra: 'Roberto',
    senha_hash: '123456',
    perfil: 'armeiro_gestor',
    posto_graduacao: 'Sargento',
    situacao_cautela: 'apto',
    data_ultimo_teste_psicologico: '2026-01-05',
  },
  {
    matricula: 'ARM-00456',
    nome: 'Cabo Fernando Silveira (Armeiro)',
    nome_de_guerra: 'Fernando Silveira',
    senha_hash: '123456',
    perfil: 'armeiro_gestor',
    posto_graduacao: 'Cabo',
    situacao_cautela: 'apto',
    data_ultimo_teste_psicologico: '2026-03-20',
  },
  {
    matricula: '128.450-2',
    nome: 'Sgt. Wagner Junior',
    nome_de_guerra: 'Wagner Junior',
    senha_hash: '123456',
    perfil: 'armeiro_gestor',
    posto_graduacao: 'Sargento',
    situacao_cautela: 'apto',
    data_ultimo_teste_psicologico: '2026-05-31',
  },
  {
    matricula: '7317573',
    nome: 'Wagner Torres',
    nome_de_guerra: 'Wagner Torres',
    senha_hash: '123456',
    perfil: 'armeiro_gestor',
    posto_graduacao: '2º Sargento',
    situacao_cautela: 'apto',
    data_ultimo_teste_psicologico: '2026-05-31',
  },
  {
    matricula: 'ARMEIRO',
    nome: 'Totem de Atendimento',
    nome_de_guerra: 'Totem',
    senha_hash: '5fac61b0fd803321c5831cd12a21649522595554c8a508bd42d4a1b4f09eab36',
    perfil: 'armeiro_gestor',
    posto_graduacao: 'Totem',
    situacao_cautela: 'apto',
    data_ultimo_teste_psicologico: '2026-05-31',
  }
];

export const mockCategorias: Categoria[] = [
  { id_categoria: 'CAT-ARMA-CURTA', nome: 'Armas de Fogo Curtas', descricao: 'Pistolas e Revólveres de porte individual' },
  { id_categoria: 'CAT-ARMA-LONGA', nome: 'Armas de Fogo Longas', descricao: 'Fuzis, Carabinas e Espingardas para emprego tático e patrulhamento' },
  { id_categoria: 'CAT-MANUTENCAO', nome: 'Colete Balístico', descricao: 'Equipamento de Proteção Individual (EPI) resistente a projéteis' },
  { id_categoria: 'CAT-COMUNICACAO', nome: 'Rádios & Telecomunicações', descricao: 'Terminais de rádio transmissor/receptor (HT) criptografados' },
  { id_categoria: 'CAT-MUNICAO', nome: 'Munições', descricao: 'Munições operacionais e de treino correspondentes' },
  { id_categoria: 'CAT-GAS-LACRIMOGENIO', nome: 'Gás Lacrimogênio', descricao: 'Agentes químicos lacrimogênios para controle de distúrbios e dispersão' }
];

export const mockMateriais: Material[] = [
  {
    id_material: '3002093',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Imbel Tam M',
    fabricante: 'IMBEL',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho M',
    quantidade_carregadores: null
  },
  {
    id_material: '3001989',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Imbel Tam M',
    fabricante: 'IMBEL',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho M',
    quantidade_carregadores: null
  },
  {
    id_material: '3002090',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Imbel Tam M',
    fabricante: 'IMBEL',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho M',
    quantidade_carregadores: null
  },
  {
    id_material: '3001993',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Imbel Tam M',
    fabricante: 'IMBEL',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho M',
    quantidade_carregadores: null
  },
  {
    id_material: '3001991',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Imbel Tam M',
    fabricante: 'IMBEL',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho M',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC00001230400140005971',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC00001230400140005431',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC00001230400140007601',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC00001230400140002011',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC00001230400140002021',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC00001230400140005511',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC0000xxxxxxxxxxxxx5871',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC00001230400140005821',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC00001230400140006601',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC00001230400140005481',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SCxxxxxxxxxxxxxxxxxxxx',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC00001230400140005931',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC00001230400140005501',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC00001230400140005491',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: 'SC0000123040014000762',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Protecop Tam G',
    fabricante: 'PROTECOP',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho G',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.276',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.276',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.278',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.278',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.284',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.284',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.283',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.283',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.286',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.286',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.253',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.253',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.246',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.246',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.266',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.266',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.275',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.275',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.249',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.249',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.260',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.260',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.254',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.254',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.279',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.279',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.250',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.250',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.271',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.271',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.245',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.245',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.273',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.273',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.252',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.252',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.216.265',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'SEP216.265',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.945',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.945',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.924',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.924',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.944',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.944',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.931',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.931',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.922',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.922',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.917',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.917',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.920',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.920',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.943',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.943',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.214.388',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY214.388',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.928',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.928',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.918',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.918',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.940',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.940',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.935',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.935',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.214.009',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY214.009',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.948',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.948',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '03600.213.927',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'HY213.927',
    fabricante: 'HYTERA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: 'BASTAO-SEM-NUMERO',
    id_categoria: 'CAT-493',
    modelo: 'Bastao Policial (Sem Numero)',
    fabricante: 'Dotacao PMDF',
    calibre: 'N/A',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Bastões policiais sem número de série individual',
    controle_quantidade: true,
    quantidade: 12,
    quantidade_carregadores: null
  },
  {
    id_material: '120',
    id_categoria: 'CAT-493',
    modelo: 'B120',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '142',
    id_categoria: 'CAT-493',
    modelo: 'B142',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '125',
    id_categoria: 'CAT-493',
    modelo: 'B125',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '101',
    id_categoria: 'CAT-493',
    modelo: 'B101',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '24',
    id_categoria: 'CAT-493',
    modelo: 'B24',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '111',
    id_categoria: 'CAT-493',
    modelo: 'B111',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '80',
    id_categoria: 'CAT-493',
    modelo: 'B80',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '76',
    id_categoria: 'CAT-493',
    modelo: 'B76',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '99',
    id_categoria: 'CAT-493',
    modelo: 'B99',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '127',
    id_categoria: 'CAT-493',
    modelo: 'B127',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '44',
    id_categoria: 'CAT-493',
    modelo: 'B44',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '121',
    id_categoria: 'CAT-493',
    modelo: 'B121',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '83',
    id_categoria: 'CAT-493',
    modelo: 'B83',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '97',
    id_categoria: 'CAT-493',
    modelo: 'B97',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '53',
    id_categoria: 'CAT-493',
    modelo: 'B53',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '147',
    id_categoria: 'CAT-493',
    modelo: 'B147',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '48',
    id_categoria: 'CAT-493',
    modelo: 'B48',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '87',
    id_categoria: 'CAT-493',
    modelo: 'B87',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '43',
    id_categoria: 'CAT-493',
    modelo: 'B43',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '93',
    id_categoria: 'CAT-493',
    modelo: 'B93',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '119',
    id_categoria: 'CAT-493',
    modelo: 'B119',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '92',
    id_categoria: 'CAT-493',
    modelo: 'B92',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '150',
    id_categoria: 'CAT-493',
    modelo: 'B150',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '22',
    id_categoria: 'CAT-493',
    modelo: 'B22',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '46',
    id_categoria: 'CAT-493',
    modelo: 'B46',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '145',
    id_categoria: 'CAT-493',
    modelo: 'B145',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '122',
    id_categoria: 'CAT-493',
    modelo: 'B122',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '13',
    id_categoria: 'CAT-493',
    modelo: 'B13',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '105',
    id_categoria: 'CAT-493',
    modelo: 'B105',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '68',
    id_categoria: 'CAT-493',
    modelo: 'B68',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '133',
    id_categoria: 'CAT-493',
    modelo: 'B133',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '34',
    id_categoria: 'CAT-493',
    modelo: 'B34',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '20',
    id_categoria: 'CAT-493',
    modelo: 'B20',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '25',
    id_categoria: 'CAT-493',
    modelo: 'B25',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '139',
    id_categoria: 'CAT-493',
    modelo: 'B139',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '28',
    id_categoria: 'CAT-493',
    modelo: 'B28',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '64',
    id_categoria: 'CAT-493',
    modelo: 'B64',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '52',
    id_categoria: 'CAT-493',
    modelo: 'B52',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '211',
    id_categoria: 'CAT-493',
    modelo: 'B211',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '70',
    id_categoria: 'CAT-493',
    modelo: 'B70',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '130',
    id_categoria: 'CAT-493',
    modelo: 'B130',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '123',
    id_categoria: 'CAT-493',
    modelo: 'B123',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '05',
    id_categoria: 'CAT-493',
    modelo: 'B05',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '65',
    id_categoria: 'CAT-493',
    modelo: 'B65',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '73',
    id_categoria: 'CAT-493',
    modelo: 'B73',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '54',
    id_categoria: 'CAT-493',
    modelo: 'B54',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '107',
    id_categoria: 'CAT-493',
    modelo: 'B107',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '39',
    id_categoria: 'CAT-493',
    modelo: 'B39',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '29',
    id_categoria: 'CAT-493',
    modelo: 'B29',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '71',
    id_categoria: 'CAT-493',
    modelo: 'B71',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '06',
    id_categoria: 'CAT-493',
    modelo: 'B06',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '72',
    id_categoria: 'CAT-493',
    modelo: 'B72',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '74',
    id_categoria: 'CAT-493',
    modelo: 'B74',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '95',
    id_categoria: 'CAT-493',
    modelo: 'B95',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '35',
    id_categoria: 'CAT-493',
    modelo: 'B35',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '113',
    id_categoria: 'CAT-493',
    modelo: 'B113',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '110',
    id_categoria: 'CAT-493',
    modelo: 'B110',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '14',
    id_categoria: 'CAT-493',
    modelo: 'B14',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '112',
    id_categoria: 'CAT-493',
    modelo: 'B112',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '40',
    id_categoria: 'CAT-493',
    modelo: 'B40',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '12',
    id_categoria: 'CAT-493',
    modelo: 'B12',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '37',
    id_categoria: 'CAT-493',
    modelo: 'B37',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: '45',
    id_categoria: 'CAT-493',
    modelo: 'B45',
    fabricante: '',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  },
  {
    id_material: 'TX-903829',
    id_categoria: 'CAT-ARMA-CURTA',
    modelo: 'Pistola Taurus TS9',
    fabricante: 'Taurus',
    calibre: '9x19mm Parabellum',
    status_atual: 'disponivel',
    data_aquisicao: '2024-05-10',
    especificacoes_tecnicas: 'Polímero de alta resistência, capacidade 17+1, percursor lançado (striker fired), trilho Picatinny.',
    quantidade_carregadores: 3
  },
  {
    id_material: 'TX-903830',
    id_categoria: 'CAT-ARMA-CURTA',
    modelo: 'Pistola Taurus TS9',
    fabricante: 'Taurus',
    calibre: '9x19mm Parabellum',
    status_atual: 'cautelado',
    data_aquisicao: '2024-05-10',
    especificacoes_tecnicas: 'Polímero de alta resistência, capacidade 17+1, percursor lançado (striker fired).',
    quantidade_carregadores: 3
  },
  {
    id_material: 'IM-102931',
    id_categoria: 'CAT-ARMA-LONGA',
    modelo: 'Fuzil de Assalto Imbel IA2',
    fabricante: 'Imbel',
    calibre: '5.56x45mm NATO',
    status_atual: 'disponivel',
    data_aquisicao: '2023-01-20',
    especificacoes_tecnicas: 'Carabina semi-automática e automática, coronha rebatível, mira holográfica integrada, capacidade 30 cartuchos.',
    quantidade_carregadores: 3
  },
  {
    id_material: 'IM-102932',
    id_categoria: 'CAT-ARMA-LONGA',
    modelo: 'Fuzil de Assalto Imbel IA2',
    fabricante: 'Imbel',
    calibre: '5.56x45mm NATO',
    status_atual: 'manutencao',
    data_aquisicao: '2023-01-20',
    data_ultima_manutencao: '2026-05-20',
    especificacoes_tecnicas: 'Fuzil padrão de dotação militar. Apresentando falha na mola recuperadora do ferrolho.',
    quantidade_carregadores: 3
  },
  {
    id_material: 'COL-NV3-871',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Balístico Kevlar Nível III-A',
    fabricante: 'Inbra Terrestre',
    calibre: 'N/A',
    status_atual: 'disponivel',
    data_aquisicao: '2025-06-01',
    especificacoes_tecnicas: 'Colete tático de proteção IIIA contra disparos de revólveres .44 Magnum e submetralhadoras 9mm.',
    data_validade: '2029-06-01'
  },
  {
    id_material: 'COL-NV3-872',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: 'Colete Balístico Kevlar Nível III-A',
    fabricante: 'Inbra Terrestre',
    calibre: 'N/A',
    status_atual: 'cautelado',
    data_aquisicao: '2025-06-01',
    especificacoes_tecnicas: 'Colete tático de proteção IIIA contra disparos de revólveres .44 Magnum.',
    data_validade: '2025-06-01' // Vencido
  },
  {
    id_material: 'HT-HAM-552',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'Rádio HT Harris Falcon III',
    fabricante: 'Harris',
    calibre: 'N/A',
    status_atual: 'disponivel',
    data_aquisicao: '2024-11-15',
    especificacoes_tecnicas: 'Rádio tático multibanda, criptografia AES-256 integrada, GPS ativo, resistência militar IP68.',
  },
  {
    id_material: 'HT-HAM-553',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'Rádio HT Harris Falcon III',
    fabricante: 'Harris',
    calibre: 'N/A',
    status_atual: 'cautelado', // Cautelado em atraso pelo Sgt Marcos Aurélio
    data_aquisicao: '2024-11-15',
    especificacoes_tecnicas: 'Rádio tático multibanda, criptografia AES-256 integrada, GPS ativo.',
  },
  {
    id_material: 'MUN-9MM',
    id_categoria: 'CAT-MUNICAO',
    modelo: 'Munição 9mm CBC Gold Flat',
    fabricante: 'CBC',
    calibre: '9x19mm Parabellum',
    status_atual: 'disponivel',
    data_aquisicao: '2025-01-10',
    especificacoes_tecnicas: 'Munição operacional de alta performance, ponta plana, calibre 9x19mm Parabellum.',
    controle_quantidade: true,
    quantidade: 500
  },
  {
    id_material: 'MUN-556',
    id_categoria: 'CAT-MUNICAO',
    modelo: 'Munição 5.56x45mm NATO CBC',
    fabricante: 'CBC',
    calibre: '5.56x45mm NATO',
    status_atual: 'disponivel',
    data_aquisicao: '2025-01-10',
    especificacoes_tecnicas: 'Munição de fuzil calibre 5.56x45mm NATO, CBC.',
    controle_quantidade: true,
    quantidade: 300
  },
  {
    id_material: 'GAS-LAC-001',
    id_categoria: 'CAT-GAS-LACRIMOGENIO',
    modelo: 'Gás Lacrimogênio - Spray',
    fabricante: 'Condor',
    calibre: 'N/A',
    status_atual: 'disponivel',
    data_aquisicao: '2025-02-15',
    especificacoes_tecnicas: 'Spray de gás lacrimogênio para controle de distúrbios civis.',
    data_validade: '2029-02-15'
  },
  {
    id_material: 'GAS-LAC-002',
    id_categoria: 'CAT-GAS-LACRIMOGENIO',
    modelo: 'Gás Lacrimogênio - GL Max',
    fabricante: 'Condor',
    calibre: 'N/A',
    status_atual: 'disponivel',
    data_aquisicao: '2023-01-10',
    especificacoes_tecnicas: 'Granada de gás lacrimogênio de emissão contínua GL-300 Max.',
    data_validade: '2025-01-10' // Vencido
  }
];

export const mockCautelas: Cautela[] = [
  {
    id_cautela: 'CAUT-0001-2026',
    matricula_policial: 'PM-921384', // Sgt Carlos Eduardo anteriormente devolveu tudo limpo
    matricula_armeiro_retirada: 'ARM-00123',
    data_retirada: '2026-05-29T07:00:00Z',
    previsao_devolucao: '2026-05-29T19:00:00Z',
    data_devolucao_efetiva: '2026-05-29T18:45:00Z',
    matricula_armeiro_devolucao: 'ARM-00123',
    status_cautela: 'devolvida',
    observacoes_retirada: 'Cautela de serviço ordinário diário.',
    observacoes_devolucao: 'Todos os materiais entregues limpos, carregadores cheios.'
  },
  {
    id_cautela: 'CAUT-0002-2026',
    matricula_policial: 'PM-734891', // Natasha (Natasha na verdade é Juliana Mendes)
    matricula_armeiro_retirada: 'ARM-00123',
    data_retirada: '2026-05-31T06:00:00Z',
    previsao_devolucao: '2026-05-31T18:00:00Z',
    status_cautela: 'ativa',
    observacoes_retirada: 'Escala ordinária de serviço operacional de radiopatrulha.',
  },
  {
    id_cautela: 'CAUT-0003-2026',
    matricula_policial: 'PM-510294', // Sgt Marcos Aurélio cautelou há muito tempo e não devolveu
    matricula_armeiro_retirada: 'ARM-00456',
    data_retirada: '2026-05-28T07:00:00Z',
    previsao_devolucao: '2026-05-28T19:00:00Z',
    status_cautela: 'atrasada',
    observacoes_retirada: 'Serviço operacional especial de fronteiras. Militar de folga com pendência.',
  }
];

export const mockCautelaItens: CautelaItem[] = [
  // Cautela resolvida de Carlos Eduardo (PM-921384)
  {
    id_cautela_item: 'ITEM-0001',
    id_cautela: 'CAUT-0001-2026',
    id_material: 'TX-903829', // Estava disponível porque já devolveu
    quantidade: 1,
    estado_entrega: 'bom',
    estado_devolucao: 'bom'
  },
  {
    id_cautela_item: 'ITEM-0002',
    id_cautela: 'CAUT-0001-2026',
    id_material: 'COL-NV3-871', // Estava disponível
    quantidade: 1,
    estado_entrega: 'excelente',
    estado_devolucao: 'excelente'
  },
  
  // Cautela ativa de Juliana Mendes (PM-734891)
  {
    id_cautela_item: 'ITEM-0003',
    id_cautela: 'CAUT-0002-2026',
    id_material: 'TX-903830', // Cautelado no momento
    quantidade: 1,
    estado_entrega: 'excelente',
  },
  {
    id_cautela_item: 'ITEM-0004',
    id_cautela: 'CAUT-0002-2026',
    id_material: 'COL-NV3-872', // Cautelado
    quantidade: 1,
    estado_entrega: 'excelente',
  },

  // Cautela atrasada de Sgt Marcos Aurélio (PM-510294)
  {
    id_cautela_item: 'ITEM-0005',
    id_cautela: 'CAUT-0003-2026',
    id_material: 'HT-HAM-553', // Rádio pendente
    quantidade: 1,
    estado_entrega: 'regular',
  }
];

export const mockManutencoes: Manutencao[] = [
  {
    id_manutencao: 'MAN-001',
    id_material: 'IM-102932', // IA2 em manutenção
    data_entrada: '2026-05-20',
    data_saida_prevista: '2026-06-05',
    descricao_problema: 'Falha intermitente na extração do estojo deflagrado (ciclo de tiro travado).'
  }
];

export const mockAuditoriaLogs: AuditoriaLog[] = [
  {
    id_log: 'LOG-001',
    data_hora: '2026-05-31T05:45:00Z',
    matricula_executor: 'ARM-00123',
    tipo_evento: 'login',
    detalhes: 'Armeiro Roberto Dias realizou login na console administrativa da armaria.'
  },
  {
    id_log: 'LOG-002',
    data_hora: '2026-05-31T06:02:11Z',
    matricula_executor: 'ARM-00123',
    tipo_evento: 'registro_cautela',
    detalhes: 'Cautela CAUT-0002-2026 ativada para PM-734891 (Juliana Mendes). Itens: TX-903830, COL-NV3-872.'
  },
  {
    id_log: 'LOG-003',
    data_hora: '2026-05-31T07:15:00Z',
    matricula_executor: 'ARM-00456',
    tipo_evento: 'bloqueio_militar',
    detalhes: 'Situação de Cautela do militar PM-510294 (Sgt Marcos Aurélio) alterada para PENDENTE devido a atraso no retorno de equipamento.'
  }
];

export const mockOcorrencias: OcorrenciaRelatorio[] = [
  {
    id_ocorrencia: 'OCO-294019',
    data_hora: '2026-05-30T07:15:00Z',
    titulo: 'Passagem de Serviço Sem Alterações',
    tipo: 'troca_turno',
    descricao: 'Realizada a conferência de todo o armamento leve e munições do paiol tático. Reserva de carga sem novidades ou discrepâncias físicas.',
    matricula_armeiro: 'ARM-00123'
  },
  {
    id_ocorrencia: 'OCO-837201',
    data_hora: '2026-05-30T14:30:00Z',
    titulo: 'Vistoria e Limpeza Semanal do Paiol',
    tipo: 'fiscalizacao',
    descricao: 'Conduzida a limpeza e lubrificação das submetralhadoras e carabinas estocadas no Setor B. Todos os cabides e travas de segurança eletrônicas operando normalmente.',
    matricula_armeiro: 'ARM-00123'
  },
  {
    id_ocorrencia: 'OCO-928410',
    data_hora: '2026-05-31T08:00:00Z',
    titulo: 'Falha Técnica em Carregador Pistola',
    tipo: 'avaria_material',
    descricao: 'Identificado lábio amassado no carregador S/N: TX-903830-C1 durante conferência matinal. O item foi preventivamente recolhido do estoque para manutenção.',
    matricula_armeiro: 'ARM-00456'
  }
];
