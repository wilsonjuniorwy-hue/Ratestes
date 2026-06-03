import React, { useState, useMemo } from 'react';
import { 
  Terminal, ShieldAlert, CheckCircle, Printer, Boxes, BookOpen, Check, AlertTriangle, X,
  PlusCircle, ClipboardList, AlertCircle, History, FileText
} from 'lucide-react';
import { OcorrenciaRelatorio, Material, PendenciaServico } from '../types';

interface OcorrenciasViewProps {
  ocorrencias: OcorrenciaRelatorio[];
  materiais: Material[];
  salvarOcorrencia: (
    titulo: string, 
    tipo: 'troca_turno' | 'avaria_material' | 'fiscalizacao' | 'outros' | 'conferencia_estoque', 
    descricao: string
  ) => void;
  handlePrintOcorrencia: (oco: OcorrenciaRelatorio) => void;
  activeArmeiroMatricula: string;
  pendenciasServico: PendenciaServico[];
  adicionarPendencia: (descricao: string) => Promise<void>;
  resolverPendencia: (id: string, resolucao: string) => Promise<void>;
}

export function OcorrenciasView({
  ocorrencias,
  materiais,
  salvarOcorrencia,
  handlePrintOcorrencia,
  activeArmeiroMatricula,
  pendenciasServico,
  adicionarPendencia,
  resolverPendencia
}: OcorrenciasViewProps) {
  // Controle de Visualização do Modal
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAlteracoesModalOpen, setIsAlteracoesModalOpen] = useState(false);

  // Estados locais do Livro de Ocorrências (Aba Diário)
  const [ocorrenciaTitulo, setOcorrenciaTitulo] = useState('');
  const [ocorrenciaTipo, setOcorrenciaTipo] = useState<'troca_turno' | 'avaria_material' | 'fiscalizacao' | 'outros' | 'conferencia_estoque'>('troca_turno');
  const [ocorrenciaDescricao, setOcorrenciaDescricao] = useState('');
  const [ocorrenciaSuccess, setOcorrenciaSuccess] = useState('');
  const [ocorrenciaError, setOcorrenciaError] = useState('');

  // Estados locais da Contagem de Estoque
  const [conferidos, setConferidos] = useState<Record<string, boolean>>({});
  const [estoqueObservacao, setEstoqueObservacao] = useState('');
  const [estoqueSuccess, setEstoqueSuccess] = useState('');
  const [estoqueError, setEstoqueError] = useState('');

  // Estados locais do Painel de Alterações (Pendências)
  const [alteracaoFilter, setAlteracaoFilter] = useState<'todas' | 'abertas' | 'resolvidas'>('todas');
  const [isNovaPendenciaFormOpen, setIsNovaPendenciaFormOpen] = useState(false);
  const [novaPendenciaDescricao, setNovaPendenciaDescricao] = useState('');
  const [pendenciaError, setPendenciaError] = useState('');
  const [pendenciaSuccess, setPendenciaSuccess] = useState('');
  
  const [isResolvingPendenciaId, setIsResolvingPendenciaId] = useState<string | null>(null);
  const [resolucaoTexto, setResolucaoTexto] = useState('');
  const [isSubmittingPendencia, setIsSubmittingPendencia] = useState(false);

  // Agrupamento de materiais por modelo para contagem
  const estoqueAgrupado = useMemo(() => {
    const groups: Record<string, {
      modelo: string;
      fabricante: string;
      categoriaId: string;
      isColetivo: boolean;
      quantidadeTotal: number;
      carregadoresTotal: number;
      breakdown: {
        disponivel: number;
        cautelado: number;
        manutencao: number;
        condenado: number;
        indisponivel: number;
        danificado: number;
        retirado: number;
      };
    }> = {};

    materiais.forEach(m => {
      const key = m.modelo;
      if (!groups[key]) {
        groups[key] = {
          modelo: m.modelo,
          fabricante: m.fabricante,
          categoriaId: m.id_categoria,
          isColetivo: !!m.controle_quantidade,
          quantidadeTotal: 0,
          carregadoresTotal: 0,
          breakdown: {
            disponivel: 0,
            cautelado: 0,
            manutencao: 0,
            condenado: 0,
            indisponivel: 0,
            danificado: 0,
            retirado: 0,
          }
        };
      }

      const qty = m.controle_quantidade ? (m.quantidade || 0) : 1;
      groups[key].quantidadeTotal += qty;
      
      if (m.quantidade_carregadores) {
        groups[key].carregadoresTotal += m.quantidade_carregadores;
      }

      const status = m.status_atual as keyof typeof groups[string]['breakdown'];
      if (groups[key].breakdown[status] !== undefined) {
        groups[key].breakdown[status] += qty;
      } else {
        groups[key].breakdown.disponivel += qty;
      }
    });

    return Object.values(groups);
  }, [materiais]);

  const handleSalvarOcorrenciaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOcorrenciaSuccess('');
    setOcorrenciaError('');

    const tituloNorm = ocorrenciaTitulo.trim();
    const descNorm = ocorrenciaDescricao.trim();

    if (!tituloNorm || !descNorm) {
      setOcorrenciaError('Preencha todos os campos do relatório.');
      return;
    }

    salvarOcorrencia(tituloNorm, ocorrenciaTipo, descNorm);

    setOcorrenciaTitulo('');
    setOcorrenciaTipo('troca_turno');
    setOcorrenciaDescricao('');
    setOcorrenciaSuccess('Relatório de ocorrência registrado e gravado no SGBD com sucesso!');
  };

  const handleFinalizarConferencia = (e: React.FormEvent) => {
    e.preventDefault();
    setEstoqueSuccess('');
    setEstoqueError('');

    // Verificar se há algum item não marcado como conferido
    const itensNaoConferidos = estoqueAgrupado.filter(g => !conferidos[g.modelo]);
    
    if (itensNaoConferidos.length > 0 && !estoqueObservacao.trim()) {
      setEstoqueError('Justificativa obrigatória: existem itens não conferidos no estoque.');
      return;
    }

    // Gerar título
    const dataHoraStr = new Date().toLocaleString('pt-BR');
    const titulo = `CONFERÊNCIA DE ESTOQUE - ${dataHoraStr}`;

    // Gerar descrição detalhada
    const listConferidos = estoqueAgrupado
      .filter(g => conferidos[g.modelo])
      .map(g => {
        const magText = g.carregadoresTotal > 0 ? ` + ${g.carregadoresTotal} carregadores` : '';
        const detailText = `(Disponível: ${g.breakdown.disponivel}, Cautelado: ${g.breakdown.cautelado}, Manutenção: ${g.breakdown.manutencao})`;
        return `- ${g.modelo} [${g.fabricante}]: ${g.quantidadeTotal} un.${magText} ${detailText}`;
      });

    const listNaoConferidos = estoqueAgrupado
      .filter(g => !conferidos[g.modelo])
      .map(g => {
        const magText = g.carregadoresTotal > 0 ? ` + ${g.carregadoresTotal} carregadores` : '';
        const detailText = `(Disponível: ${g.breakdown.disponivel}, Cautelado: ${g.breakdown.cautelado}, Manutenção: ${g.breakdown.manutencao})`;
        return `- ${g.modelo} [${g.fabricante}]: ${g.quantidadeTotal} un.${magText} ${detailText}`;
      });

    const breakdownText = `=== CONFERÊNCIA FÍSICA E QUANTITATIVA DE ESTOQUE ===
Data/Hora: ${dataHoraStr}
Resultado Geral: ${itensNaoConferidos.length === 0 ? 'CONCORDÂNCIA PLENA DO PAIOL' : 'DIVERGÊNCIA / ITENS EM ABERTO'}

ITENS CONFERIDOS E OK:
${listConferidos.length > 0 ? listConferidos.join('\n') : '- Nenhum item marcado como OK.'}

ITENS EM ABERTO / PENDENTES:
${listNaoConferidos.length > 0 ? listNaoConferidos.join('\n') : '- Nenhum item com divergência.'}

OBSERVAÇÕES E RELATOS DE DIVERGÊNCIA:
${estoqueObservacao.trim() || 'Sem divergências ou alterações físicas relatadas. O estoque físico confere integralmente com os dados do SGBD.'}
`;

    salvarOcorrencia(titulo, 'conferencia_estoque', breakdownText);

    // Limpar estados
    setConferidos({});
    setEstoqueObservacao('');
    setEstoqueSuccess('Conferência de estoque registrada no Livro de Ocorrências com sucesso!');
    
    // Fechar o modal após 1.8s para ver o log gerado
    setTimeout(() => {
      setIsStockModalOpen(false);
      setEstoqueSuccess('');
    }, 1800);
  };

  const handleTentativaFecharModal = () => {
    const hasProgress = Object.values(conferidos).some(val => val === true) || estoqueObservacao.trim() !== '';
    if (hasProgress) {
      const confirmClose = window.confirm(
        "Você possui alterações pendentes na contagem de estoque. Deseja realmente fechar? Todo o progresso não gravado será perdido."
      );
      if (!confirmClose) return;
    }
    // Limpar estados e fechar
    setConferidos({});
    setEstoqueObservacao('');
    setEstoqueError('');
    setEstoqueSuccess('');
    setIsStockModalOpen(false);
  };

  const handleNovaPendenciaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendenciaError('');
    setPendenciaSuccess('');
    
    const desc = novaPendenciaDescricao.trim();
    if (!desc) {
      setPendenciaError('Descreva a pendência antes de gravar.');
      return;
    }

    try {
      setIsSubmittingPendencia(true);
      await adicionarPendencia(desc);
      setPendenciaSuccess('Pendência de serviço registrada com sucesso!');
      setNovaPendenciaDescricao('');
      setIsNovaPendenciaFormOpen(false);
      
      setTimeout(() => {
        setPendenciaSuccess('');
      }, 3000);
    } catch (err: any) {
      setPendenciaError('Erro ao registrar pendência: ' + err.message);
    } finally {
      setIsSubmittingPendencia(false);
    }
  };

  const handleResolverPendenciaSubmit = async (e: React.FormEvent, idPendencia: string) => {
    e.preventDefault();
    setPendenciaError('');
    setPendenciaSuccess('');

    const res = resolucaoTexto.trim();
    if (!res) {
      setPendenciaError('Descreva o que foi feito para resolver a pendência.');
      return;
    }

    try {
      setIsSubmittingPendencia(true);
      await resolverPendencia(idPendencia, res);
      setPendenciaSuccess('Pendência marcada como resolvida com sucesso!');
      setIsResolvingPendenciaId(null);
      setResolucaoTexto('');
      
      setTimeout(() => {
        setPendenciaSuccess('');
      }, 3000);
    } catch (err: any) {
      setPendenciaError('Erro ao resolver pendência: ' + err.message);
    } finally {
      setIsSubmittingPendencia(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="arm-ocorrencias-view">
      {/* Top Banner com Botão de Abertura do Modal */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 shadow-lg">
        <div className="space-y-1">
          <h3 className="text-xs font-bold font-mono text-slate-205 uppercase tracking-widest flex items-center gap-2">
            <Terminal className="h-4.5 w-4.5 text-blue-505 glow-blue" />
            <span>Livro Digital de Ocorrências</span>
          </h3>
          <p className="text-xs text-slate-450 font-sans">Visualização e registro histórico das atividades diárias e ocorrências bélicas da reserva.</p>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          {/* Botão de Contagem de Estoque */}
          <button
            onClick={() => setIsStockModalOpen(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-550 active:scale-95 text-white font-bold font-mono text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-950/45 glow-cyan duration-150"
          >
            <Boxes className="h-4 w-4 text-white animate-pulse" />
            <span>CONTAGEM DE ESTOQUE</span>
          </button>

          {/* Botão de Alterações do Serviço */}
          <button
            onClick={() => {
              setIsAlteracoesModalOpen(true);
              setPendenciaError('');
              setPendenciaSuccess('');
              setIsNovaPendenciaFormOpen(false);
              setNovaPendenciaDescricao('');
              setIsResolvingPendenciaId(null);
              setResolucaoTexto('');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-550 active:scale-95 text-white font-bold font-mono text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-950/45 glow-blue duration-150"
          >
            <BookOpen className="h-4 w-4 text-white animate-pulse" />
            <span>ALTERAÇÕES DO SERVIÇO</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Formulário de Registro de Ocorrência (Sempre Visível) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4" id="arm-ocorrencias-form-wrapper">
            <div className="border-b border-slate-850 pb-3 flex items-center gap-2">
              <Terminal className="h-4.5 w-4.5 text-blue-550" />
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">Registrar Nova Ocorrência</h3>
            </div>
            
            <form onSubmit={handleSalvarOcorrenciaSubmit} className="space-y-4 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide">Título / Assunto:</label>
                <input
                  type="text"
                  required
                  placeholder="EX: TROCA DE TURNO - SEM ALTERAÇÕES"
                  value={ocorrenciaTitulo}
                  onChange={(e) => setOcorrenciaTitulo(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-805 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Tipo de Ocorrência:</label>
                <select
                  value={ocorrenciaTipo}
                  onChange={(e) => setOcorrenciaTipo(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs text-slate-205 focus:outline-none rounded-lg cursor-pointer font-sans"
                >
                  <option value="troca_turno">Passagem/Troca de Turno</option>
                  <option value="avaria_material">Avaria / Falha de Material</option>
                  <option value="fiscalizacao">Fiscalização / Vistoria</option>
                  <option value="conferencia_estoque">Conferência de Estoque</option>
                  <option value="outros">Outros Incidentes</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Descrição Detalhada:</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Descreva detalhadamente o evento, informando seriais de armas envolvidas, estado do cofre, selos de segurança ou anomalias observadas..."
                  value={ocorrenciaDescricao}
                  onChange={(e) => setOcorrenciaDescricao(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              {ocorrenciaError && (
                <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-start gap-2 animate-pulse">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{ocorrenciaError}</span>
                </div>
              )}

              {ocorrenciaSuccess && (
                <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-lg text-xs text-emerald-450 font-mono flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{ocorrenciaSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-registrar-ocorrencia-submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-2.5 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider cursor-pointer glow-blue"
              >
                Registrar no Livro
              </button>
            </form>
          </div>
        </div>

        {/* Lado Direito: Histórico de Ocorrências (Sempre Visível) */}
        <div className="lg:col-span-5 space-y-4" id="arm-ocorrencias-list-wrapper">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">Livro Digital de Registro</h3>
              <span className="text-[8px] bg-blue-955/50 text-blue-400 font-mono border border-blue-900/50 px-2 py-0.5 rounded font-black uppercase">
                Ativo ({ocorrencias.length})
              </span>
            </div>

            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1" id="ocorrencias-list">
              {ocorrencias.map((oco) => (
                <div 
                  key={oco.id_ocorrencia} 
                  className="bg-slate-955/40 p-4 border border-slate-855/80 rounded-lg hover:border-slate-750 transition-all font-mono text-xs space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                        oco.tipo === 'troca_turno'
                          ? 'bg-blue-955/50 text-blue-400 border-blue-900/40'
                          : oco.tipo === 'avaria_material'
                          ? 'bg-red-955/50 text-red-400 border-red-900/40'
                          : oco.tipo === 'fiscalizacao'
                          ? 'bg-emerald-950/50 text-emerald-455 border-emerald-900/40'
                          : oco.tipo === 'conferencia_estoque'
                          ? 'bg-purple-955/50 text-purple-400 border-purple-900/40 font-bold'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800'
                      }`}>
                        {oco.tipo.replace('_', ' ')}
                      </span>
                      <span className="text-slate-500 text-[9px]">ID: {oco.id_ocorrencia}</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handlePrintOcorrencia(oco)}
                      className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-455 hover:text-slate-200 py-1 px-2 rounded text-[9px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 cursor-pointer no-print font-mono"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Imprimir</span>
                    </button>
                  </div>

                  <div className="space-y-1 font-sans">
                    <h4 className="text-xs font-bold text-slate-100 uppercase font-mono">{oco.titulo}</h4>
                    <p className="text-[11px] text-slate-400 leading-normal whitespace-pre-wrap">{oco.descricao}</p>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-slate-905">
                    <span>Registrado: {new Date(oco.data_hora).toLocaleString()}</span>
                    <span>Armeiro: <strong className="text-slate-400">{oco.matricula_armeiro}</strong></span>
                  </div>
                </div>
              ))}
              
              {ocorrencias.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-550 leading-loose">
                  Nenhuma ocorrência ou relatório cadastrado na base simulada do paiol.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* JANELA MODAL DE CONTAGEM DE ESTOQUE */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp"
            id="arm-conferencia-estoque-wrapper"
          >
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-850 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-cyan-405" />
                <div>
                  <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-widest">Painel de Contagem de Estoque</h3>
                  <p className="text-[10px] text-slate-450 font-sans mt-0.5 font-normal">Realize a conferência física dos itens ativos do paiol.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] bg-cyan-955/50 text-cyan-400 font-mono border border-cyan-900/50 px-2.5 py-1 rounded font-black uppercase">
                  Total Modelos: {estoqueAgrupado.length}
                </span>
                <button
                  type="button"
                  onClick={handleTentativaFecharModal}
                  className="p-1.5 rounded-lg bg-slate-955 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Fechar Janela"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Form / Body do Modal */}
            <form onSubmit={handleFinalizarConferencia} className="flex-1 flex flex-col overflow-hidden">
              {/* Área Rolável Interna */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {estoqueAgrupado.map((group) => {
                    const isChecked = !!conferidos[group.modelo];
                    const isAmmo = group.categoriaId === 'CAT-MUNICAO';
                    return (
                      <div 
                        key={group.modelo} 
                        className={`p-3.5 border rounded-xl transition-all duration-200 flex flex-col justify-between gap-3 ${
                          isChecked 
                            ? 'bg-emerald-950/10 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.05)]' 
                            : 'bg-slate-955/40 border-slate-850 hover:border-slate-800'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <span className="text-[8px] font-mono text-slate-500 block uppercase tracking-wider truncate">{group.fabricante}</span>
                              <h4 className="text-[11px] font-bold text-slate-205 uppercase leading-snug truncate">{group.modelo}</h4>
                            </div>
                            <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded shrink-0 ${
                              isAmmo ? 'bg-amber-955/50 text-amber-400 border border-amber-900/40' : 'bg-blue-955/50 text-blue-400 border border-blue-900/40'
                            }`}>
                              {isAmmo ? 'MUNIÇÃO' : 'PATRIMÔNIO'}
                            </span>
                          </div>

                          <div className="text-xs font-mono py-0.5">
                            <div className="text-slate-350 font-black text-[12px] flex flex-wrap items-center gap-1">
                              <span>{group.quantidadeTotal} {isAmmo ? 'munições' : 'unidades'}</span>
                              {group.carregadoresTotal > 0 && (
                                <span className="text-slate-500 text-[10px] font-normal">
                                  (+ {group.carregadoresTotal} carregadores)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Detalhamento de Status */}
                          <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-900/60">
                            <span className="text-xs bg-slate-900/60 text-emerald-400 border border-slate-850/50 px-2 py-1 rounded font-mono">
                              {group.breakdown.disponivel} na reserva
                            </span>
                            {group.breakdown.cautelado > 0 && (
                              <span className="text-xs bg-slate-900/60 text-blue-400 border border-slate-850/50 px-2 py-1 rounded font-mono">
                                {group.breakdown.cautelado} na rua
                              </span>
                            )}
                            {group.breakdown.manutencao > 0 && (
                              <span className="text-xs bg-slate-900/60 text-amber-500 border border-slate-850/50 px-2 py-1 rounded font-mono">
                                {group.breakdown.manutencao} em manutenção
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botão de Toggle Checkbox */}
                        <button
                          type="button"
                          onClick={() => {
                            setConferidos(prev => ({
                              ...prev,
                              [group.modelo]: !prev[group.modelo]
                            }));
                          }}
                          className={`w-full py-1.5 px-2 rounded-lg border font-mono text-[9px] font-bold uppercase transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                            isChecked 
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20' 
                              : 'bg-slate-900 border-slate-800 text-slate-450 hover:border-slate-750 hover:text-slate-350'
                          }`}
                        >
                          {isChecked ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Estoque Conferido</span>
                            </>
                          ) : (
                            <>
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
                              <span>Marcar como Conferido</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-850">
                  <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide flex items-center gap-1">
                    <span>Observações / Relato de Divergências:</span>
                    {estoqueAgrupado.some(g => !conferidos[g.modelo]) && (
                      <span className="text-red-400 text-[8px] font-bold font-mono animate-pulse">
                        (OBRIGATÓRIO: ITENS EM ABERTO)
                      </span>
                    )}
                  </label>
                  <textarea
                    rows={3}
                    value={estoqueObservacao}
                    onChange={(e) => setEstoqueObservacao(e.target.value)}
                    placeholder="Justifique discrepâncias físicas ou o porquê de deixar algum item sem marcar..."
                    className="w-full bg-slate-955 border border-slate-805 p-2 text-xs text-slate-205 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20 placeholder-slate-650"
                  />
                </div>

                {estoqueError && (
                  <div className="bg-red-955/30 border border-red-900/40 p-2.5 rounded-lg text-[10px] text-red-400 font-mono flex items-start gap-2 animate-pulse">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{estoqueError}</span>
                  </div>
                )}

                {estoqueSuccess && (
                  <div className="bg-emerald-950/30 border border-emerald-900/40 p-2.5 rounded-lg text-[10px] text-emerald-450 font-mono flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{estoqueSuccess}</span>
                  </div>
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleTentativaFecharModal}
                  className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar / Fechar
                </button>
                
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono text-xs rounded-lg transition-all shadow-md hover:shadow-blue-500/20 active:scale-95 duration-150 cursor-pointer flex items-center gap-1.5 glow-blue"
                >
                  <Boxes className="h-4 w-4" />
                  <span>Finalizar Conferência</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JANELA MODAL DE ALTERAÇÕES DO SERVIÇO (PENDÊNCIAS) */}
      {isAlteracoesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp"
            id="arm-alteracoes-servico-wrapper"
          >
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-850 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-505 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-widest">Alterações do Serviço & Pendências</h3>
                  <p className="text-[10px] text-slate-455 font-sans mt-0.5 font-normal">Quadro bélico de pendências em aberto e histórico de resoluções de plantão.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsNovaPendenciaFormOpen(prev => !prev);
                    setPendenciaError('');
                    setPendenciaSuccess('');
                  }}
                  className="px-3.5 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-900/30 rounded-lg font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>{isNovaPendenciaFormOpen ? 'Ver Pendências' : 'Criar Nova Pendência'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAlteracoesModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-955 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Fechar Janela"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
              {/* Avisos rápidos de Sucesso / Erro */}
              {pendenciaSuccess && (
                <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-lg text-xs text-emerald-450 font-mono flex items-center gap-2 animate-fadeIn">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{pendenciaSuccess}</span>
                </div>
              )}
              {pendenciaError && (
                <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-center gap-2 animate-pulse">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{pendenciaError}</span>
                </div>
              )}

              {isNovaPendenciaFormOpen ? (
                /* Formulário de Nova Pendência */
                <form onSubmit={handleNovaPendenciaSubmit} className="space-y-4 bg-slate-955/50 border border-slate-850 p-5 rounded-xl animate-fadeIn">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-blue-450" />
                      <span>Descreva a alteração ou pendência a ser registrada:</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={novaPendenciaDescricao}
                      onChange={(e) => setNovaPendenciaDescricao(e.target.value)}
                      placeholder="Descreva detalhadamente a alteração observada (Ex: 'Substituição da lâmpada de emergência queimada na sala de munições', 'Rádio HT patrimônio 2812 com carregador quebrado'...)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 p-3 text-xs text-slate-205 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      disabled={isSubmittingPendencia}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNovaPendenciaFormOpen(false);
                        setNovaPendenciaDescricao('');
                        setPendenciaError('');
                      }}
                      className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 font-bold font-mono text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                      disabled={isSubmittingPendencia}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold font-mono text-[10px] uppercase rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5 glow-blue"
                      disabled={isSubmittingPendencia}
                    >
                      {isSubmittingPendencia ? 'Gravando...' : 'Gravar Alteração/Pendência'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Listagem de Pendências */
                <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                  {/* Filtros de Status */}
                  <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                    {(['todas', 'abertas', 'resolvidas'] as const).map((filter) => {
                      const isActive = alteracaoFilter === filter;
                      const label = filter === 'todas' ? 'Todas' : filter === 'abertas' ? 'Em Aberto' : 'Resolvidas';
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => {
                            setAlteracaoFilter(filter);
                            setIsResolvingPendenciaId(null);
                            setResolucaoTexto('');
                            setPendenciaError('');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all tracking-wider ${
                            isActive
                              ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400'
                              : 'bg-slate-950 border border-slate-800 text-slate-450 hover:text-slate-350'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Lista Rolável */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
                    {(() => {
                      const filtered = pendenciasServico.filter((p) => {
                        if (alteracaoFilter === 'abertas') return p.status === 'aberto';
                        if (alteracaoFilter === 'resolvidas') return p.status === 'resolvido';
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-12 text-slate-505 font-mono text-xs border border-dashed border-slate-805 rounded-xl bg-slate-955/20">
                            Nenhuma alteração ou pendência encontrada neste filtro.
                          </div>
                        );
                      }

                      return filtered.map((item) => {
                        const isOpen = item.status === 'aberto';
                        const isResolving = isResolvingPendenciaId === item.id_pendencia;
                        return (
                          <div
                            key={item.id_pendencia}
                            className={`p-4 border rounded-xl transition-all duration-205 flex flex-col gap-3.5 relative ${
                              isOpen
                                ? 'bg-red-955/5 border-red-900/30 hover:border-red-900/50 shadow-[0_0_12px_rgba(239,68,68,0.02)]'
                                : 'bg-emerald-955/5 border-emerald-900/20 hover:border-emerald-900/40'
                            }`}
                          >
                            {/* Top info and status badge */}
                            <div className="flex items-center justify-between gap-3 border-b border-slate-850/40 pb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded border ${
                                  isOpen
                                    ? 'bg-red-955/35 text-red-400 border-red-900/40 animate-pulse'
                                    : 'bg-emerald-950/35 text-emerald-450 border-emerald-900/40'
                                }`}>
                                  {isOpen ? 'Em Aberto' : 'Resolvido'}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">ID: {item.id_pendencia.substring(0, 8).toUpperCase()}</span>
                              </div>
                              <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                                <span>Criado em: {new Date(item.data_criacao).toLocaleString()}</span>
                                <span className="text-slate-300 font-bold">Por: {item.matricula_criador}</span>
                              </div>
                            </div>

                            {/* Description text */}
                            <div className="text-slate-100 text-sm font-sans font-medium leading-relaxed whitespace-pre-wrap">
                              {item.descricao}
                            </div>

                            {/* Resolution Details or Resolve Form */}
                            {!isOpen && item.resolucao && (
                              <div className="bg-emerald-950/15 border border-emerald-900/25 p-3.5 rounded-lg flex flex-col gap-1.5 animate-fadeIn">
                                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 border-b border-emerald-900/10 pb-1.5 flex-wrap gap-1">
                                  <span className="flex items-center gap-1 font-bold">
                                    <Check className="h-4 w-4" />
                                    <span>RESOLVIDO</span>
                                  </span>
                                  <span>
                                    Em: {new Date(item.data_resolucao || '').toLocaleString()} | Resolvedor: <strong className="text-emerald-300">{item.matricula_resolvedor}</strong>
                                  </span>
                                </div>
                                <p className="text-sm font-sans text-slate-200 leading-relaxed italic">
                                  &ldquo;{item.resolucao}&rdquo;
                                </p>
                              </div>
                            )}

                            {isOpen && (
                              <div className="flex flex-col gap-3">
                                {!isResolving ? (
                                  <div className="flex justify-end pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsResolvingPendenciaId(item.id_pendencia);
                                        setResolucaoTexto('');
                                        setPendenciaError('');
                                      }}
                                      className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-900/30 hover:border-emerald-800/80 rounded-lg text-[11px] font-mono font-bold uppercase transition-all duration-150 cursor-pointer flex items-center gap-1.5"
                                    >
                                      <Check className="h-4 w-4" />
                                      <span>Marcar como Resolvido</span>
                                    </button>
                                  </div>
                                ) : (
                                  /* Form de Resolução */
                                  <form 
                                    onSubmit={(e) => handleResolverPendenciaSubmit(e, item.id_pendencia)}
                                    className="bg-slate-955 border border-slate-805 p-4 rounded-lg space-y-3.5 animate-fadeIn"
                                  >
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Descreva o que foi feito para resolver (justificativa de resolução) *:</label>
                                      <textarea
                                        required
                                        rows={2}
                                        value={resolucaoTexto}
                                        onChange={(e) => setResolucaoTexto(e.target.value)}
                                        placeholder="Ex: HT enviado para substituição no DLS, ou HT reparado com troca de bateria..."
                                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 p-2 text-xs text-slate-205 focus:outline-none rounded focus:ring-1 focus:ring-emerald-500/20"
                                        disabled={isSubmittingPendencia}
                                      />
                                    </div>
                                    <div className="flex items-center justify-end gap-2.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsResolvingPendenciaId(null);
                                          setResolucaoTexto('');
                                        }}
                                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-450 hover:text-slate-205 text-[9px] font-mono font-bold uppercase rounded cursor-pointer"
                                        disabled={isSubmittingPendencia}
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        type="submit"
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-555 text-white text-[9px] font-mono font-bold uppercase rounded cursor-pointer transition-colors shadow-md"
                                        disabled={isSubmittingPendencia}
                                      >
                                        {isSubmittingPendencia ? 'Enviando...' : 'Confirmar Resolução'}
                                      </button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-slate-955/40 border-t border-slate-850 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsAlteracoesModalOpen(false)}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Fechar Janela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
