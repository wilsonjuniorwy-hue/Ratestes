import React, { useState } from 'react';
import { 
  LayoutDashboard, UserPlus, ClipboardList, Search, History, FileCheck2, 
  Clock, ShieldAlert, CheckCircle, Printer, X, Timer, Briefcase, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Usuario, Material, Cautela, CautelaItem, AuditoriaLog, SituacaoMilitar, CondicaoUso } from '../types';

interface ArmeiroViewProps {
  usuarios: Usuario[];
  materiais: Material[];
  cautelas: Cautela[];
  cautelaItens: CautelaItem[];
  auditoriaLogs: AuditoriaLog[];
  cadastrarPolicial: (novoPolicial: Usuario) => Promise<{ success: boolean; error?: string }>;
  processDevolucao: (
    cautId: string, 
    idsMateriaisDevolvidos: string[], 
    claimConditions: Record<string, CondicaoUso>, 
    observacoes: string, 
    prorrogar: boolean, 
    returnedQuantities?: Record<string, number>,
    consumedQuantities?: Record<string, number>
  ) => void;
  handlePrintCautelas: () => void;
  handlePrintLogs: () => void;
  printLogDate: string;
  setPrintLogDate: (date: string) => void;
  activeArmeiroMatricula?: string;
  authenticatedPerfil?: string;
  excluirCautelaTotal?: (idCautela: string) => Promise<{ success: boolean }>;
  onOpenPermanentTotem?: () => void;
}

export function ArmeiroView({
  usuarios,
  materiais,
  cautelas,
  cautelaItens,
  auditoriaLogs,
  cadastrarPolicial,
  processDevolucao,
  handlePrintCautelas,
  handlePrintLogs,
  printLogDate,
  setPrintLogDate,
  activeArmeiroMatricula,
  authenticatedPerfil,
  excluirCautelaTotal,
  onOpenPermanentTotem
}: ArmeiroViewProps) {
  // ---- FLUXO ARMEIRO: ESTADOS LOCAIS ----
  const [armeiroSubTab, setArmeiroSubTab] = useState<'dashboard' | 'cadastro_usuarios' | 'consulta_historico' | 'auditoria' | 'logs' | 'cautelas_permanentes'>('dashboard');
  const [searchMaterialTerm, setSearchMaterialTerm] = useState('');
  const [selectedAuditMaterial, setSelectedAuditMaterial] = useState<Material | null>(null);
  const [expandedPermanentPms, setExpandedPermanentPms] = useState<Record<string, boolean>>({});

  const togglePermanentPmExpand = (matricula: string) => {
    setExpandedPermanentPms(prev => ({
      ...prev,
      [matricula]: !prev[matricula]
    }));
  };

  // Estados para Cadastro de Policiais
  const [newMatricula, setNewMatricula] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newNomeDeGuerra, setNewNomeDeGuerra] = useState('');
  const [newPosto, setNewPosto] = useState('Soldado');
  const [newSituacao, setNewSituacao] = useState<SituacaoMilitar>('apto');
  const [cadastroUsuarioError, setCadastroUsuarioError] = useState('');
  const [cadastroUsuarioSuccess, setCadastroUsuarioSuccess] = useState('');

  // Estados para Busca Consolidada de Histórico
  const [filterPolicial, setFilterPolicial] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterData, setFilterData] = useState('');

  // ADIÇÃO DA DEVOLUÇÃO
  const [returnCautelaId, setReturnCautelaId] = useState<string>('');
  const [claimConditions, setClaimConditions] = useState<Record<string, CondicaoUso>>({});
  const [observacoesDevolucao, setObservacoesDevolucao] = useState('Sem novidades. Todos os materiais nos seus devidos estados.');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [itemsToReturn, setItemsToReturn] = useState<string[]>([]);
  const [prorrogarCautela, setProrrogarCautela] = useState(false);
  const [devolucaoSuccessMsg, setDevolucaoSuccessMsg] = useState('');
  const [devolucaoErrorMsg, setDevolucaoErrorMsg] = useState('');
  const [returnedQuantities, setReturnedQuantities] = useState<Record<string, number>>({});
  const [consumedQuantities, setConsumedQuantities] = useState<Record<string, number>>({});

  React.useEffect(() => {
    setReturnedQuantities({});
    setConsumedQuantities({});
  }, [returnCautelaId]);

  const getDisponivelQty = (mat: Material) => {
    if (!mat.controle_quantidade) {
      return mat.status_atual === 'disponivel' ? 1 : 0;
    }
    const total = mat.quantidade || 0;
    const activeQty = cautelaItens
      .filter(ci => {
        const c = cautelas.find(caut => caut.id_cautela === ci.id_cautela);
        return ci.id_material === mat.id_material && c && (c.status_cautela === 'ativa' || c.status_cautela === 'atrasada' || c.status_cautela === 'prorrogada') && !ci.estado_devolucao;
      })
      .reduce((sum, ci) => sum + ci.quantidade, 0);
    return Math.max(0, total - activeQty);
  };

  // ---- CADASTRO DE NOVO POLICIAL MILITAR ----
  const handleCadastrarPolicialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCadastroUsuarioError('');
    setCadastroUsuarioSuccess('');

    const matriculaNorm = newMatricula.trim().toUpperCase();
    if (!matriculaNorm) {
      setCadastroUsuarioError('Informe a matrícula.');
      return;
    }

    if (usuarios.some(u => u.matricula.trim().toUpperCase() === matriculaNorm)) {
      setCadastroUsuarioError('Matrícula já cadastrada no sistema.');
      return;
    }

    const novoPolicial: Usuario = {
      matricula: matriculaNorm,
      nome: newNome.trim(),
      nome_de_guerra: newNomeDeGuerra.trim(),
      senha_hash: '', // primeiro acesso criará a senha
      perfil: 'policial',
      posto_graduacao: newPosto,
      situacao_cautela: newSituacao,
      data_ultimo_teste_psicologico: new Date().toISOString().split('T')[0], // data de hoje
    };

    try {
      const result = await cadastrarPolicial(novoPolicial);
      if (result && !result.success) {
        setCadastroUsuarioError(result.error || 'Erro ao cadastrar policial.');
      } else {
        setNewMatricula('');
        setNewNome('');
        setNewNomeDeGuerra('');
        setNewPosto('Soldado');
        setNewSituacao('apto');
        setCadastroUsuarioSuccess('Policial cadastrado com sucesso! Matrícula liberada para primeiro acesso no Totem.');
      }
    } catch (err: any) {
      setCadastroUsuarioError(err.message || 'Erro ao realizar cadastro.');
    }
  };

  // ---- EXCLUIR CAUTELA CLIQUE (ADMIN) ----
  const handleExcluirCautelaClick = async (idCautela: string) => {
    if (!excluirCautelaTotal) return;
    const userConfirm = window.confirm(`Deseja realmente excluir permanentemente a cautela ${idCautela}? As armas/HT vinculadas voltarão ao status 'disponível' e a quantidade de munição será reintegrada ao estoque.`);
    if (userConfirm) {
      try {
        await excluirCautelaTotal(idCautela);
        alert(`Guia de Cautela ${idCautela} foi completamente excluída do sistema.`);
      } catch (err: any) {
        alert('Erro ao excluir cautela: ' + err.message);
      }
    }
  };

  // ---- EFETIVAR DEVOLUÇÃO ----
  const handleDevolucaoSubmit = () => {
    setDevolucaoSuccessMsg('');
    setDevolucaoErrorMsg('');
    if (!returnCautelaId) return;
    if (itemsToReturn.length === 0 && !prorrogarCautela) {
      setDevolucaoErrorMsg('Selecione ao menos um item para devolução ou marque a opção de prorrogar a cautela.');
      return;
    }
    processDevolucao(returnCautelaId, itemsToReturn, claimConditions, observacoesDevolucao, prorrogarCautela, returnedQuantities, consumedQuantities);
    // Não fecha o modal — armeiro pode dar baixa em mais policiais
    setDevolucaoSuccessMsg(`✔ Baixa registrada com sucesso para a cautela ${returnCautelaId}. Selecione outro militar para continuar.`);
    // Apenas limpa a seleção atual para permitir nova operação
    setReturnCautelaId('');
    setItemsToReturn([]);
    setProrrogarCautela(false);
    setObservacoesDevolucao('Sem novidades. Todos os materiais nos seus devidos estados.');
    setClaimConditions({});
    setConsumedQuantities({});
  };

  // ---- SALVAR APENAS A PRORROGAÇÃO (sem dar baixa em itens) ----
  const handleSalvarProrrogacao = () => {
    setDevolucaoSuccessMsg('');
    setDevolucaoErrorMsg('');
    if (!returnCautelaId || !prorrogarCautela) return;
    // Chama processDevolucao sem itens devolvidos, apenas com prorrogar=true
    processDevolucao(returnCautelaId, [], {}, observacoesDevolucao, true);
    setDevolucaoSuccessMsg(`⏳ Prorrogação registrada com sucesso para a cautela ${returnCautelaId}. A dotação foi estendida por mais 24h.`);
    // Mantém o PM selecionado para facilitar dar baixa depois
    setProrrogarCautela(false);
    setObservacoesDevolucao('Sem novidades. Todos os materiais nos seus devidos estados.');
  };

  return (
    <div className="space-y-6" id="armeiro-panel-root">
      
      {/* Sub tabs do Armeiro */}
      <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 border border-slate-850 rounded-xl" id="armeiro-subtabs">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Painel Geral' },
          { id: 'cadastro_usuarios', icon: UserPlus, label: 'Cadastrar PM' },
          { id: 'consulta_historico', icon: ClipboardList, label: 'Histórico & Busca' },
          { id: 'auditoria', icon: Search, label: 'Dossiê Itens' },
          { id: 'logs', icon: History, label: 'Trilha Logs' },
          { id: 'cautelas_permanentes', icon: Briefcase, label: 'Carga Permanente' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = armeiroSubTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`btn-arm-tab-${tab.id}`}
              onClick={() => setArmeiroSubTab(tab.id as any)}
              className={`px-3 py-2 text-[10px] md:text-xs font-bold font-mono border rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600/10 text-white border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]'
                  : 'border-transparent text-slate-450 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Icon className="h-4 w-4 text-blue-500 shrink-0" />
              <span>{tab.label.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB A: dashboard monitoramento Real-time */}
      {armeiroSubTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="arm-dashboard-view">
          
          {/* Lado Esquerdo: Estatísticas Rápidas */}
          <div className="lg:col-span-4 space-y-6" id="arm-stats-column">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <LayoutDashboard className="h-4 w-4 text-blue-500" />
                <span>Indicadores de Paiol</span>
              </div>

              <div className="grid grid-cols-2 gap-3" id="stats-grid">
                <div className="bg-slate-950/60 p-3.5 border border-slate-850 rounded-lg text-center">
                  <span className="text-[8px] text-slate-500 font-mono block uppercase tracking-wider font-black">Cautelas Ativas</span>
                  <span className="text-xl font-black text-blue-400 font-mono">
                    {cautelas.filter(c => c.status_cautela === 'ativa' || c.status_cautela === 'atrasada').length}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3.5 border border-slate-850 rounded-lg text-center">
                  <span className="text-[8px] text-slate-500 font-mono block uppercase tracking-wider font-black">Atrasos Críticos</span>
                  <span className="text-xl font-black text-red-500 font-mono">
                    {cautelas.filter(c => c.status_cautela === 'atrasada').length}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3.5 border border-slate-850 rounded-lg text-center col-span-2">
                  <span className="text-[8px] text-slate-500 font-mono block uppercase tracking-wider font-black">Materiais Livres no Paiol</span>
                  <span className="text-xl font-black text-cyan-400 font-mono">
                    {materiais.filter(m => m.status_atual === 'disponivel').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Caixa Rápida para Devolução / Receber Material */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-slate-200 font-mono uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
                <FileCheck2 className="h-4.5 w-4.5 text-blue-500 glow-blue" />
                <span>Registrar Baixa de Cautela</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Acesse o painel integrado de devoluções para inspecionar os equipamentos, homologar desgastes e realizar a baixa parcial ou total da dotação de carga do militar.
              </p>
              
              <button
                type="button"
                id="btn-open-return-modal"
                onClick={() => {
                  setIsReturnModalOpen(true);
                  setReturnCautelaId('');
                  setReturnSearchQuery('');
                  setItemsToReturn([]);
                  setObservacoesDevolucao('Sem novidades. Todos os materiais nos seus devidos estados.');
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-xs font-mono transition-colors cursor-pointer uppercase tracking-wider shadow-md glow-blue flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                <span>Abrir Painel de Devolução</span>
              </button>
            </div>
          </div>

          {/* Lado Direito: Listagem do Monitoramento RTM */}
          <div className="lg:col-span-8 space-y-4" id="arm-rtm-panel">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-slate-950/60 p-5 border-b border-slate-850 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold font-mono text-slate-205 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-cyan-400 glow-cyan animate-pulse" />
                    <span>Rastreabilidade em Tempo Real (RTM)</span>
                  </h3>
                  <p className="text-xs text-slate-455 font-sans">Listagem instantânea de todo material que ultrapassou a portaria e está sob custódia operacional.</p>
                </div>
                <span className="text-[9px] bg-blue-955/50 text-blue-400 font-mono px-3 py-1 rounded-full border border-blue-900/50 uppercase font-black tracking-wider">
                  CONEXÃO ATIVA
                </span>
              </div>

              <div className="p-5 overflow-x-auto" id="dashboard-rtm-table-wrapper">
                <table className="w-full text-left text-xs text-slate-350" id="dashboard-rtm-table">
                  <thead className="bg-[#0b1329]/65 border border-slate-850 text-slate-455 font-mono text-[9px] uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Identificador</th>
                      <th className="p-4">Militar Carga</th>
                      <th className="p-4">Itens Retirados</th>
                      <th className="p-4">Retirada / Limite</th>
                      <th className="p-4">Estado</th>
                      {authenticatedPerfil === 'admin' && <th className="p-4">Ação</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50 font-sans text-xs">
                    {cautelas.filter(c => c.status_cautela === 'ativa' || c.status_cautela === 'atrasada' || c.status_cautela === 'prorrogada').map((caut) => {
                      const policial = usuarios.find(u => u.matricula === caut.matricula_policial);
                      const itens = cautelaItens.filter(ci => ci.id_cautela === caut.id_cautela);
                      
                      return (
                        <tr key={caut.id_cautela} className="hover:bg-slate-900/25 transition-colors">
                          <td className="p-4 font-mono font-bold text-blue-400">{caut.id_cautela}</td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-200">{policial?.posto_graduacao} {policial?.nome_de_guerra || policial?.nome}</span>
                              <span className="text-[9px] text-slate-500 font-mono mt-0.5">RG: {caut.matricula_policial}</span>
                            </div>
                          </td>
                          <td className="p-4 space-y-1.5 font-mono text-[10px] max-w-xs">
                            {itens.map(ci => {
                              const matItem = materiais.find(m => m.id_material === ci.id_material);
                              return (
                                <div key={ci.id_cautela_item} className="bg-slate-950/60 px-2.5 py-1 rounded border border-slate-850 flex items-center justify-between gap-2">
                                  <span className="text-slate-350 truncate">{matItem?.modelo}</span>
                                  <span className="text-slate-505 text-[8px] font-mono shrink-0">({ci.id_material})</span>
                                </div>
                              );
                            })}
                          </td>
                          <td className="p-4 font-mono text-[10px] text-slate-400 leading-relaxed">
                            <div>Saída: {new Date(caut.data_retirada).toLocaleTimeString()}</div>
                            <div className="text-amber-505 mt-0.5">Prazo: {new Date(caut.previsao_devolucao).toLocaleTimeString()}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1.5 items-start">
                              <span className={`text-[8px] font-mono font-black uppercase px-2.5 py-1 rounded-full border ${
                                caut.status_cautela === 'atrasada'
                                  ? 'bg-red-955/40 text-red-400 border-red-900/50 glow-red animate-pulse'
                                  : caut.status_cautela === 'prorrogada'
                                  ? 'bg-amber-950/40 text-amber-400 border-amber-800/50'
                                  : 'bg-emerald-950/40 text-emerald-450 border-emerald-900/30'
                              }`}>
                                {caut.status_cautela === 'atrasada' ? '⚠️ ATRASADO' : caut.status_cautela === 'prorrogada' ? '⏳ PRORROGADA' : '● NA RUA'}
                              </span>
                              {caut.prorrogada && caut.data_prorrogacao && (
                                <span className="text-[7px] font-mono text-amber-600 block leading-tight">
                                  Aut. {new Date(caut.data_prorrogacao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </td>
                          {authenticatedPerfil === 'admin' && (
                            <td className="p-4">
                              <button
                                onClick={() => handleExcluirCautelaClick(caut.id_cautela)}
                                className="px-2.5 py-1.5 bg-slate-955 hover:bg-red-955/20 border border-slate-800 hover:border-red-900/50 text-[10px] font-mono text-slate-400 hover:text-red-450 rounded-lg transition-colors font-bold uppercase cursor-pointer"
                              >
                                Excluir
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {cautelas.filter(c => c.status_cautela === 'ativa' || c.status_cautela === 'atrasada' || c.status_cautela === 'prorrogada').length === 0 && (
                      <tr>
                        <td colSpan={authenticatedPerfil === 'admin' ? 6 : 5} className="p-8 text-center text-slate-505 font-mono text-xs leading-loose">
                          Nenhuma cautela tática ativa no momento. Toda a carga bélica encontra-se resguardada no paiol físico.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB B: CADASTRO DE POLICIAIS */}
      {armeiroSubTab === 'cadastro_usuarios' && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 shadow-lg max-w-xl mx-auto w-full space-y-6" id="arm-cadastro-view">
          <div className="border-b border-slate-850 pb-4">
            <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              <span>Cadastrar Novo Policial Militar</span>
            </h3>
            <p className="text-xs text-slate-455 font-sans mt-0.5">Insira os dados do militar para liberação de acesso e criação de senha no totem.</p>
          </div>

          <form onSubmit={handleCadastrarPolicialSubmit} className="space-y-4 font-sans" id="form-cadastro-usuario">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide">Nome Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="EX: JEAN-CLAUDE VAN DAMME"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide">Nome de Guerra:</label>
                <input
                  type="text"
                  required
                  placeholder="EX: VAN DAMME"
                  value={newNomeDeGuerra}
                  onChange={(e) => setNewNomeDeGuerra(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide">Matrícula (RG Funcional):</label>
                <input
                  type="text"
                  required
                  placeholder="EX: PM-333333"
                  value={newMatricula}
                  onChange={(e) => setNewMatricula(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 focus:border-blue-500 p-2.5 text-xs font-mono text-slate-200 focus:outline-none uppercase rounded-lg focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide">Posto / Graduação:</label>
                <select
                  value={newPosto}
                  onChange={(e) => setNewPosto(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-805 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg cursor-pointer"
                >
                  {['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide">Situação do Porte / Cautela:</label>
                <select
                  value={newSituacao}
                  onChange={(e) => setNewSituacao(e.target.value as SituacaoMilitar)}
                  className="w-full bg-slate-955 border border-slate-805 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg cursor-pointer"
                >
                  <option value="apto">Ativo (Apto)</option>
                  <option value="suspenso">Suspenso</option>
                  <option value="restrito_servico">Restrito ao Serviço</option>
                </select>
              </div>
            </div>

            {cadastroUsuarioError && (
              <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <span>{cadastroUsuarioError}</span>
              </div>
            )}

            {cadastroUsuarioSuccess && (
              <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-lg text-xs text-emerald-450 font-mono flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-455" />
                <span>{cadastroUsuarioSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              id="btn-submit-cadastrar-policial"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-3 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider cursor-pointer glow-blue"
            >
              Salvar Cadastro e Liberar Operador
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB C: CONSULTA CONSOLIDADA (BUSCA HISTÓRICA) */}
      {armeiroSubTab === 'consulta_historico' && (
        <div className="space-y-6" id="arm-consulta-historico-view">
          
          {/* Filtros */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
            <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Search className="h-4 w-4 text-blue-505" />
              <span>Filtros de Busca de Cautela e Movimentações</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 text-xs font-sans">
                <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide block">Filtrar por Policial:</label>
                <input
                  type="text"
                  placeholder="Nome, Guerra ou Matrícula..."
                  value={filterPolicial}
                  onChange={(e) => setFilterPolicial(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5 text-xs font-sans">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Filtrar por Armamento/Material:</label>
                <input
                  type="text"
                  placeholder="Modelo ou serial/RFID..."
                  value={filterMaterial}
                  onChange={(e) => setFilterMaterial(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5 text-xs font-sans">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Filtrar por Data:</label>
                <input
                  type="date"
                  value={filterData}
                  onChange={(e) => setFilterData(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {(filterPolicial || filterMaterial || filterData) && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setFilterPolicial('');
                    setFilterMaterial('');
                    setFilterData('');
                  }}
                  className="text-[10px] font-mono text-red-400 hover:text-red-300 font-bold uppercase tracking-wider bg-transparent border-none cursor-pointer"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>

          {/* Tabela de Resultados */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-slate-955/65 p-5 border-b border-slate-850 flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="h-4.5 w-4.5 text-cyan-400" />
                <span>Dossiê Consolidado de Cautelas (Histórico Completo)</span>
              </h3>
              <button
                type="button"
                onClick={handlePrintCautelas}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-2 px-4 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer glow-blue no-print"
              >
                <Printer className="h-3.5 w-3.5 text-white shrink-0" />
                <span>Imprimir Dossiê</span>
              </button>
            </div>

            <div className="p-5 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-350" id="table-historico-cautelas">
                <thead className="bg-[#0b1329]/65 border border-slate-850 text-slate-455 font-mono text-[9px] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Código Guia</th>
                    <th className="p-4">Policial Beneficiário</th>
                    <th className="p-4">Inventário de Carga</th>
                    <th className="p-4">Retirada / Armeiro</th>
                    <th className="p-4">Devolução / Armeiro</th>
                    <th className="p-4">Status</th>
                    {authenticatedPerfil === 'admin' && <th className="p-4 no-print">Ação</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50 font-sans text-xs">
                  {cautelas
                    .filter(c => {
                      const pol = usuarios.find(u => u.matricula === c.matricula_policial);
                      if (filterPolicial) {
                        const term = filterPolicial.toLowerCase();
                        const matchNome = pol?.nome.toLowerCase().includes(term);
                        const matchGuerra = pol?.nome_de_guerra?.toLowerCase().includes(term);
                        const matchMat = c.matricula_policial.toLowerCase().includes(term);
                        if (!matchNome && !matchGuerra && !matchMat) return false;
                      }

                      const cItens = cautelaItens.filter(ci => ci.id_cautela === c.id_cautela);
                      if (filterMaterial) {
                        const term = filterMaterial.toLowerCase();
                        const matchesItem = cItens.some(ci => {
                          const mat = materiais.find(m => m.id_material === ci.id_material);
                          return mat?.modelo.toLowerCase().includes(term) || ci.id_material.toLowerCase().includes(term);
                        });
                        if (!matchesItem) return false;
                      }

                      if (filterData) {
                        const dateVal = new Date(c.data_retirada).toISOString().split('T')[0];
                        if (dateVal !== filterData) return false;
                      }

                      return true;
                    })
                    .map(c => {
                      const pol = usuarios.find(u => u.matricula === c.matricula_policial);
                      const cItens = cautelaItens.filter(ci => ci.id_cautela === c.id_cautela);

                      return (
                        <tr key={c.id_cautela} className="hover:bg-slate-900/25 transition-colors">
                          <td className="p-4 font-mono font-bold text-blue-400 align-top">{c.id_cautela}</td>
                          <td className="p-4 align-top">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-205">{pol?.posto_graduacao} {pol?.nome_de_guerra || pol?.nome}</span>
                              <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                                RG: {c.matricula_policial} {pol?.nome_de_guerra ? `(Guerra: ${pol.nome_de_guerra})` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 space-y-1.5 max-w-xs align-top">
                            {cItens.map(ci => {
                              const matItem = materiais.find(m => m.id_material === ci.id_material);
                              return (
                                <div key={ci.id_cautela_item} className="bg-slate-950/60 px-2.5 py-1.5 rounded border border-slate-850 text-[10px] font-mono flex items-center justify-between gap-2">
                                  <span className="text-slate-300 truncate">
                                    {matItem?.modelo} {matItem?.controle_quantidade ? `(x${ci.quantidade})` : ''}
                                  </span>
                                  <span className="text-slate-505 text-[8px]">
                                    {matItem?.controle_quantidade ? 'Item Coletivo' : ci.id_material}
                                  </span>
                                </div>
                              );
                            })}
                          </td>
                          <td className="p-4 font-mono text-[10px] text-slate-400 align-top leading-relaxed">
                            <div>{new Date(c.data_retirada).toLocaleString()}</div>
                            <div className="text-slate-505 mt-0.5">Armeiro: {c.matricula_armeiro_retirada}</div>
                          </td>
                          <td className="p-4 font-mono text-[10px] text-slate-400 align-top leading-relaxed">
                            {c.data_devolucao_efetiva ? (
                              <>
                                <div>{new Date(c.data_devolucao_efetiva).toLocaleString()}</div>
                                <div className="text-slate-505 mt-0.5">Armeiro: {c.matricula_armeiro_devolucao}</div>
                              </>
                            ) : (
                              <span className="text-slate-505 italic">Em Aberto</span>
                            )}
                          </td>
                          <td className="p-4 align-top">
                            <span className={`text-[8px] font-mono font-black uppercase px-2.5 py-1 rounded-full border ${
                              c.status_cautela === 'devolvida'
                                ? 'bg-emerald-950/40 text-emerald-450 border-emerald-900/30'
                                : c.status_cautela === 'atrasada'
                                ? 'bg-red-955/40 text-red-400 border-red-900/30 glow-red animate-pulse'
                                : 'bg-blue-955/40 text-blue-400 border-blue-900/30'
                            }`}>
                              {c.status_cautela === 'devolvida' ? '● DEVOLVIDA' : c.status_cautela === 'atrasada' ? '⚠️ ATRASADA' : '● ATIVA'}
                            </span>
                          </td>
                          {authenticatedPerfil === 'admin' && (
                            <td className="p-4 align-top no-print">
                              <button
                                onClick={() => handleExcluirCautelaClick(c.id_cautela)}
                                className="px-2.5 py-1.5 bg-slate-955 hover:bg-red-955/20 border border-slate-800 hover:border-red-900/50 text-[10px] font-mono text-slate-400 hover:text-red-450 rounded-lg transition-colors font-bold uppercase cursor-pointer"
                              >
                                Excluir
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  {cautelas.filter(c => {
                    const pol = usuarios.find(u => u.matricula === c.matricula_policial);
                    if (filterPolicial) {
                      const term = filterPolicial.toLowerCase();
                      const matchNome = pol?.nome.toLowerCase().includes(term);
                      const matchGuerra = pol?.nome_de_guerra?.toLowerCase().includes(term);
                      const matchMat = c.matricula_policial.toLowerCase().includes(term);
                      if (!matchNome && !matchGuerra && !matchMat) return false;
                    }
                    const cItens = cautelaItens.filter(ci => ci.id_cautela === c.id_cautela);
                    if (filterMaterial) {
                      const term = filterMaterial.toLowerCase();
                      const matchesItem = cItens.some(ci => {
                        const mat = materiais.find(m => m.id_material === ci.id_material);
                        return mat?.modelo.toLowerCase().includes(term) || ci.id_material.toLowerCase().includes(term);
                      });
                      if (!matchesItem) return false;
                    }
                    if (filterData) {
                      const dateVal = new Date(c.data_retirada).toISOString().split('T')[0];
                      if (dateVal !== filterData) return false;
                    }
                    return true;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={authenticatedPerfil === 'admin' ? 7 : 6} className="p-8 text-center text-slate-505 font-mono">
                        Nenhum registro de cautela encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB D: PESQUISA E AUDITORIA DETALHADA DE MATERIAL */}
      {armeiroSubTab === 'auditoria' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="arm-auditoria-view">
          
          {/* Painel de Busca */}
          <div className="lg:col-span-4 space-y-4" id="arm-search-sidebar">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <Search className="h-4 w-4 text-blue-500" />
                <span>Estoque e Rastreabilidade</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  id="input-search-material"
                  placeholder="Modelo, marca ou serial..."
                  value={searchMaterialTerm}
                  onChange={(e) => setSearchMaterialTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-xs font-mono text-slate-205 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
                <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-550" />
              </div>

              <div className="space-y-1.5 h-[340px] overflow-y-auto pr-1" id="audit-materials-list">
                {materiais
                  .filter(m => 
                    m.modelo.toLowerCase().includes(searchMaterialTerm.toLowerCase()) || 
                    m.id_material.toLowerCase().includes(searchMaterialTerm.toLowerCase()) ||
                    m.fabricante.toLowerCase().includes(searchMaterialTerm.toLowerCase())
                  )
                  .map((mat) => {
                    const isSelected = selectedAuditMaterial?.id_material === mat.id_material;
                    return (
                      <button
                        key={mat.id_material}
                        id={`btn-select-audit-${mat.id_material}`}
                        onClick={() => setSelectedAuditMaterial(mat)}
                        className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 flex justify-between items-center cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/10 border-blue-500/40 text-white shadow-sm'
                            : 'bg-slate-950/20 border-slate-850/60 text-slate-400 hover:border-slate-750 hover:text-slate-200'
                        }`}
                      >
                        <div className="space-y-1 font-mono">
                          <span className="text-[9px] text-slate-500 block">SN: {mat.id_material}</span>
                          <h4 className={`text-xs font-bold uppercase font-sans ${isSelected ? 'text-white' : 'text-slate-300'}`}>{mat.modelo}</h4>
                        </div>
                        <span className={`text-[8px] uppercase font-black font-mono px-2 py-0.5 rounded border ${
                          mat.status_atual === 'disponivel'
                            ? 'bg-emerald-950/30 text-emerald-450 border-emerald-900/30'
                            : mat.status_atual === 'cautelado'
                            ? 'bg-blue-955/30 text-blue-400 border-blue-900/30'
                            : 'bg-red-955/30 text-red-400 border-red-900/30'
                        }`}>
                          {mat.status_atual.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Histórico e Detalhes */}
          <div className="lg:col-span-8" id="arm-audit-history">
            <AnimatePresence mode="wait">
              {selectedAuditMaterial ? (
                <motion.div 
                  key={selectedAuditMaterial.id_material}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-6"
                >
                  <div className="border-b border-slate-850 pb-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[8px] bg-blue-955 text-blue-400 font-mono px-2.5 py-0.5 rounded border border-blue-900/50 uppercase font-black tracking-wider">Ficha Cadastral do Item</span>
                      <h2 className="text-sm font-extrabold text-white uppercase font-mono">{selectedAuditMaterial.modelo}</h2>
                      <p className="text-xs text-slate-455 font-sans">Histórico patrimonial e RFID metalúrgico de controle.</p>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider font-bold">Número de Série</div>
                      <div className="text-xs font-black text-cyan-405 mt-0.5">{selectedAuditMaterial.id_material}</div>
                    </div>
                  </div>

                  <div className="bg-slate-950/45 border border-slate-850/80 p-4.5 rounded-lg space-y-3 text-xs">
                    <span className="text-[8px] text-slate-500 font-mono uppercase font-black tracking-wider block">Especificações de Registro Técnico</span>
                    <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-900">
                      <div className="space-y-0.5">
                        <div className="text-[9px] text-slate-500 font-mono">Fabricante:</div>
                        <div className="font-bold text-slate-300 font-sans">{selectedAuditMaterial.fabricante}</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[9px] text-slate-500 font-mono">Calibre:</div>
                        <div className="font-bold text-slate-300 font-sans">{selectedAuditMaterial.calibre || 'N/A'}</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[9px] text-slate-500 font-mono">Status Operacional:</div>
                        <div className="font-bold text-blue-450 uppercase font-mono">{selectedAuditMaterial.status_atual}</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[9px] text-slate-500 font-mono">Inclusão em Carga:</div>
                        <div className="font-semibold text-slate-300 font-mono">{selectedAuditMaterial.data_aquisicao}</div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans italic">{selectedAuditMaterial.especificacoes_tecnicas}</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2 border-b border-slate-850 pb-2">
                      <History className="h-4.5 w-4.5 text-blue-505" />
                      <span>Timeline de Movimentações</span>
                    </h3>

                    <div className="space-y-4 pl-2" id="audit-timeline">
                      {cautelas
                        .filter(c => {
                          const ci = cautelaItens.filter(ci => ci.id_cautela === c.id_cautela);
                          return ci.some(item => item.id_material === selectedAuditMaterial.id_material);
                        })
                        .map((caut) => {
                          const pm = usuarios.find(u => u.matricula === caut.matricula_policial);
                          const itemDtl = cautelaItens.find(ci => ci.id_cautela === caut.id_cautela && ci.id_material === selectedAuditMaterial.id_material);
                          
                          return (
                            <div key={caut.id_cautela} className="border-l border-slate-800 pl-4 py-1.5 relative space-y-2">
                              <div className="absolute -left-[4.5px] top-[18px] w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-slate-950 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />

                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-200">
                                  Guia de Cautela <span className="font-mono text-blue-400 font-black">{caut.id_cautela}</span>
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {new Date(caut.data_retirada).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="font-mono text-[10px] text-slate-450 leading-relaxed space-y-0.5">
                                <p>Operador: <strong className="text-slate-305 font-sans font-bold">{pm?.posto_graduacao} {pm?.nome_de_guerra || pm?.nome} ({caut.matricula_policial})</strong></p>
                                <p>Saída: {new Date(caut.data_retirada).toLocaleTimeString()} (Armeiro: {caut.matricula_armeiro_retirada})</p>
                                {caut.data_devolucao_efetiva ? (
                                  <p className="text-emerald-450 font-bold uppercase tracking-wider text-[9px] mt-1 bg-emerald-950/20 px-2 py-0.5 border border-emerald-900/30 rounded w-fit">
                                    Devolução: {new Date(caut.data_devolucao_efetiva).toLocaleString()} | Laudo: {(itemDtl?.estado_devolucao || 'bom').toUpperCase()}
                                  </p>
                                ) : (
                                  <p className="text-red-400 font-bold uppercase tracking-wider text-[9px] mt-1 bg-red-955/20 px-2 py-0.5 border border-red-900/30 rounded w-fit animate-pulse">
                                    ● Cautela Ativa (Em Campo)
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      {cautelas.filter(c => {
                        const ci = cautelaItens.filter(ci => ci.id_cautela === c.id_cautela);
                        return ci.some(item => item.id_material === selectedAuditMaterial.id_material);
                      }).length === 0 && (
                        <div className="text-[11px] text-slate-500 font-mono p-4 bg-slate-955/40 rounded-lg border border-slate-850 text-center">
                          Não constam registros de movimentação para este serial no banco simulador.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-10 shadow-lg flex flex-col items-center justify-center text-center h-[280px] text-slate-500" id="audit-no-selection-face">
                  <Search className="h-8 w-8 text-slate-700 mb-3 animate-pulse" />
                  <p className="text-xs font-mono max-w-xs leading-relaxed">Selecione um equipamento bélico no inventário esquerdo para descriptografar seu dossiê e vistorias históricas.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* SUBTAB E: TRILHA DE LOGS DE AUDITORIA */}
      {armeiroSubTab === 'logs' && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-lg space-y-4" id="arm-logs-view">
          <div className="bg-slate-950/60 p-5 border-b border-slate-850 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-blue-505" />
                <span>Trilha Forense Imutável de Auditoria (Write-Once)</span>
              </h3>
              <p className="text-xs text-slate-455 mt-0.5">Procedimentos de DML monitorados por gatilhos indestrutíveis. Bloqueados contra ações de UPDATE e DELETE.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 no-print">
              <div className="flex flex-col text-right">
                <span className="text-[8px] font-mono text-slate-500 uppercase font-black tracking-wider block mb-0.5">Data p/ Impressão:</span>
                <input
                  type="date"
                  value={printLogDate}
                  onChange={(e) => setPrintLogDate(e.target.value)}
                  className="bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-[10px] font-mono text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>
              
              <button
                type="button"
                onClick={handlePrintLogs}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-2 px-4 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer glow-blue"
              >
                <Printer className="h-3.5 w-3.5 text-white shrink-0" />
                <span>Imprimir Logs</span>
              </button>
            </div>
          </div>

          <div className="p-5" id="audit-logs-table-wrapper">
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {auditoriaLogs.map((log) => (
                <div key={log.id_log} className="bg-slate-950/60 p-4 rounded-lg border border-slate-850/80 flex items-start gap-4 text-xs leading-relaxed font-mono hover:bg-slate-955/80 transition-all">
                  <div className="flex flex-col text-slate-500 shrink-0 text-right min-w-[70px]">
                    <span className="font-bold text-slate-400">{new Date(log.data_hora).toLocaleTimeString()}</span>
                    <span className="text-[8px] mt-0.5">{new Date(log.data_hora).toLocaleDateString()}</span>
                  </div>
                  <div className={`px-2.5 py-0.5 rounded text-[8px] font-black shrink-0 uppercase border ${
                    log.tipo_evento === 'login'
                      ? 'bg-blue-955/50 text-blue-450 border-blue-900/40'
                      : log.tipo_evento === 'registro_cautela'
                      ? 'bg-emerald-950/50 text-emerald-450 border-emerald-900/40'
                      : log.tipo_evento === 'registro_devolucao'
                      ? 'bg-cyan-955/50 text-cyan-405 border-cyan-900/40'
                      : 'bg-amber-955/50 text-amber-450 border-amber-900/40'
                  }`}>
                    {log.tipo_evento.replace('_', ' ')}
                  </div>
                  <div className="flex-1 space-y-1 text-[11px]">
                    <p className="text-slate-350">{log.detalhes}</p>
                    <p className="text-[9px] text-slate-505">
                      Executor: <span className="text-blue-400 font-bold">
                        {(() => {
                          const exec = usuarios.find(u => u.matricula === log.matricula_executor);
                          return exec ? `${exec.posto_graduacao} ${exec.nome_de_guerra || exec.nome} (${log.matricula_executor})` : log.matricula_executor;
                        })()}
                      </span> | ID Transação: {log.id_log}
                    </p>
                  </div>
                </div>
              ))}
              {auditoriaLogs.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500 font-mono">
                  Não há logs de segurança gerados nesta sessão.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB F: CAUTELAS PERMANENTES */}
      {armeiroSubTab === 'cautelas_permanentes' && (
        <div className="space-y-6" id="arm-permanent-cautelas-view">
          {/* Banner Informativo e Ação */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="h-4.5 w-4.5 text-blue-505" />
                <span>Gestão de Cargas Bélicas Pessoais (Cautelas Permanentes)</span>
              </h3>
              <p className="text-xs text-slate-455 mt-0.5 animate-none">
                Consulte e gerencie os itens sob posse definitiva de militares da unidade. Cargas marcadas como permanentes não possuem limite diário de devolução.
              </p>
            </div>
            
            {onOpenPermanentTotem && (
              <button
                type="button"
                onClick={onOpenPermanentTotem}
                className="bg-blue-600 hover:bg-blue-550 text-white border border-blue-500/30 text-xs font-mono font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-md glow-blue uppercase tracking-wider"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span>Abrir Totem para Cautela Permanente</span>
              </button>
            )}
          </div>

          {/* Listagem agrupada por Militar */}
          <div className="space-y-4">
            {(() => {
              const permanentCautelas = cautelas.filter(c => c.status_cautela === 'permanente');
              const permanentGroups = Array.from(new Set(permanentCautelas.map(c => c.matricula_policial)))
                .map(matricula => {
                  const pm = usuarios.find(u => u.matricula === matricula);
                  const pmCautelas = permanentCautelas.filter(c => c.matricula_policial === matricula);
                  const pmItems = pmCautelas.flatMap(c => {
                    const items = cautelaItens.filter(ci => ci.id_cautela === c.id_cautela && !ci.estado_devolucao);
                    return items.map(item => ({
                      ...item,
                      cautela: c
                    }));
                  });

                  return {
                    pm,
                    matricula,
                    cautelas: pmCautelas,
                    items: pmItems
                  };
                })
                .filter(group => group.items.length > 0);

              if (permanentGroups.length === 0) {
                return (
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center min-h-[250px]">
                    <Briefcase className="h-8 w-8 text-slate-800 mb-3" />
                    <p className="max-w-xs leading-relaxed">Nenhum policial militar possui carga permanente ativa registrada no sistema no momento.</p>
                  </div>
                );
              }

              return permanentGroups.map(group => {
                const isExpanded = expandedPermanentPms[group.matricula] !== false;
                
                return (
                  <div 
                    key={group.matricula}
                    className="bg-slate-900/40 border border-slate-850 rounded-xl overflow-hidden transition-all duration-200"
                  >
                    {/* Header do Grupo */}
                    <div 
                      onClick={() => togglePermanentPmExpand(group.matricula)}
                      className="p-4 bg-slate-950/50 flex justify-between items-center cursor-pointer hover:bg-slate-950/80 transition-colors border-b border-slate-850/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-955/20 border border-blue-900/30 flex items-center justify-center text-blue-450 font-mono font-bold text-xs uppercase">
                          {group.pm?.nome_de_guerra?.slice(0, 2) || 'PM'}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200 font-sans uppercase">
                            {group.pm ? `${group.pm.posto_graduacao} ${group.pm.nome_de_guerra || group.pm.nome}` : `Policial (${group.matricula})`}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Matrícula: {group.matricula} {group.pm?.nome_de_guerra ? `| Guerra: ${group.pm.nome_de_guerra}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold bg-blue-950/50 border border-blue-900/30 text-blue-450 px-2 py-0.5 rounded-full">
                          {group.items.length} {group.items.length === 1 ? 'item acautelado' : 'itens acautelados'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-450" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-455" />
                        )}
                      </div>
                    </div>

                    {/* Tabela de Itens (se expandido) */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-350 font-sans border-collapse">
                          <thead className="bg-[#0b1329]/50 border-b border-slate-850 text-slate-455 font-mono text-[9px] uppercase tracking-wider">
                            <tr>
                              <th className="p-3">Código/RFID</th>
                              <th className="p-3">Categoria</th>
                              <th className="p-3">Item / Modelo</th>
                              <th className="p-3 text-center">Quantidade</th>
                              <th className="p-3">Data Carga</th>
                              <th className="p-3 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850/50 font-sans text-xs">
                            {group.items.map(item => {
                              const mat = materiais.find(m => m.id_material === item.id_material);
                              return (
                                <tr key={item.id_cautela_item} className="hover:bg-slate-900/10 transition-colors">
                                  <td className="p-3 font-mono font-bold text-blue-400">{item.id_material}</td>
                                  <td className="p-3">
                                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-slate-400 font-bold uppercase">
                                      {mat?.id_categoria.replace('CAT-', '') || 'BÉLICO'}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-200 uppercase">{mat?.modelo || 'Não identificado'}</span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        {mat?.fabricante && mat.fabricante !== 'N/A' ? `${mat.fabricante} ` : ''}
                                        {mat?.calibre && mat.calibre !== 'N/A' ? `[Calibre: ${mat.calibre}]` : ''}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold">{item.quantidade}</td>
                                  <td className="p-3 text-slate-400 font-mono">{new Date(item.cautela.data_retirada).toLocaleDateString('pt-BR')}</td>
                                  <td className="p-3">
                                    <div className="flex justify-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const userConfirm = window.confirm(`Deseja realmente dar baixa expressa no item ${mat?.modelo || item.id_material} do PM ${group.pm?.nome_de_guerra || group.matricula}?`);
                                          if (userConfirm) {
                                            processDevolucao(
                                              item.cautela.id_cautela,
                                              [item.id_material],
                                              { [item.id_material]: 'bom' },
                                              'Baixa expressa de carga pessoal permanente pelo armeiro.',
                                              false,
                                              { [item.id_material]: item.quantidade },
                                              {}
                                            );
                                          }
                                        }}
                                        className="bg-emerald-600/15 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 font-mono font-bold px-2.5 py-1.5 rounded text-[10px] uppercase transition-all cursor-pointer hover:shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                                      >
                                        Devolver
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Modal de Baixa de Cautela */}
      <AnimatePresence>
        {isReturnModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md"
            id="modal-return-cautela-wrapper"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[96vw] lg:max-w-7xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative text-left"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20 text-blue-400">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Devolução de Equipamentos (Baixa de Cautela)</h3>
                    <p className="text-[10px] text-slate-455 font-sans">Pesquise pelo policial militar, pelo material ou pelo serial para receber a dotação de volta.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-450 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Feedback de Sucesso / Erro */}
              {devolucaoSuccessMsg && (
                <div className="mx-6 mt-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3.5 flex items-center gap-3 text-emerald-400 font-mono text-xs font-bold">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{devolucaoSuccessMsg}</span>
                </div>
              )}
              {devolucaoErrorMsg && (
                <div className="mx-6 mt-4 bg-red-955/30 border border-red-800/50 rounded-xl p-3.5 flex items-center gap-3 text-red-400 font-mono text-xs font-bold">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{devolucaoErrorMsg}</span>
                </div>
              )}

              {/* Corpo */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                
                {/* Lado Esquerdo: Filtros e Cautelas Ativas */}
                <div className="lg:col-span-6 flex flex-col space-y-4 overflow-hidden h-full">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-505" />
                    <input
                      type="text"
                      placeholder="Buscar por PM (nome/guerra/matrícula), material ou serial/código..."
                      value={returnSearchQuery}
                      onChange={(e) => setReturnSearchQuery(e.target.value)}
                      className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-3.5 pl-10 text-xs font-mono text-slate-200 focus:outline-none rounded-lg transition-all focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[480px] lg:max-h-[580px]">
                    {(() => {
                      const cautelasVisiveis = cautelas
                        .filter(c => c.status_cautela === 'ativa' || c.status_cautela === 'atrasada' || c.status_cautela === 'prorrogada')
                        .filter(c => {
                          const q = returnSearchQuery.toLowerCase().trim();
                          if (!q) return true;
                          const pm = usuarios.find(u => u.matricula === c.matricula_policial);
                          const cItens = cautelaItens.filter(ci => ci.id_cautela === c.id_cautela);
                          const matchesPm = pm?.nome.toLowerCase().includes(q) ||
                                            pm?.nome_de_guerra?.toLowerCase().includes(q) ||
                                            c.matricula_policial.toLowerCase().includes(q);
                          const matchesMat = cItens.some(ci => {
                            const mat = materiais.find(m => m.id_material === ci.id_material);
                            return mat?.modelo.toLowerCase().includes(q) || ci.id_material.toLowerCase().includes(q);
                          });
                          return matchesPm || matchesMat;
                        });

                      if (cautelasVisiveis.length === 0) {
                        return (
                          <div className="text-center p-8 border border-dashed border-slate-800 rounded-lg text-slate-500 font-mono text-xs">
                            Nenhuma cautela tática ativa localizada{returnSearchQuery ? ` para "${returnSearchQuery}"` : ''}.
                          </div>
                        );
                      }

                      return cautelasVisiveis.map(c => {
                        const pm = usuarios.find(u => u.matricula === c.matricula_policial);
                        const cItens = cautelaItens.filter(ci => ci.id_cautela === c.id_cautela && !ci.estado_devolucao);
                        const isSelected = returnCautelaId === c.id_cautela;

                        return (
                          <button
                            key={c.id_cautela}
                            type="button"
                            onClick={() => {
                              setReturnCautelaId(c.id_cautela);
                              const matches = cautelaItens.filter(ci => ci.id_cautela === c.id_cautela && !ci.estado_devolucao);
                              setItemsToReturn(matches.map(m => m.id_material));
                              const initial: Record<string, CondicaoUso> = {};
                              matches.forEach(m => { initial[m.id_material] = 'bom'; });
                              setClaimConditions(initial);
                              setDevolucaoSuccessMsg('');
                              setDevolucaoErrorMsg('');
                            }}
                            className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 flex flex-col gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600/10 border-blue-500/40 text-white shadow-sm'
                                : 'bg-slate-950/20 border-slate-850/60 text-slate-400 hover:border-slate-750 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-start w-full">
                              <div className="space-y-0.5">
                                <span className="text-[9px] text-slate-500 font-mono block">CÓDIGO: {c.id_cautela}</span>
                                <h4 className="text-xs font-black uppercase text-slate-205">{pm?.posto_graduacao} {pm?.nome_de_guerra || pm?.nome}</h4>
                                <span className="text-[9px] text-slate-500 font-mono">Matrícula: {c.matricula_policial}</span>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                {/* Badge de status — reage em tempo real ao checkbox de prorrogação */}
                                {(() => {
                                  const isProrrogandoAgora = isSelected && prorrogarCautela;
                                  const badgeClass = isProrrogandoAgora || c.status_cautela === 'prorrogada'
                                    ? 'bg-amber-950/30 text-amber-400 border-amber-800/40'
                                    : c.status_cautela === 'atrasada'
                                    ? 'bg-red-955/20 text-red-400 border-red-900/30'
                                    : 'bg-emerald-950/20 text-emerald-455 border-emerald-900/30';
                                  const badgeText = isProrrogandoAgora || c.status_cautela === 'prorrogada'
                                    ? '⏳ CAUTELA +24H'
                                    : c.status_cautela === 'atrasada'
                                    ? '⚠️ ATRASADA'
                                    : '● EM CAMPO';
                                  return (
                                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded border transition-all duration-200 ${badgeClass}`}>
                                      {badgeText}
                                    </span>
                                  );
                                })()}
                                {c.prorrogada && c.data_prorrogacao && (
                                  <span className="text-[7px] font-mono text-amber-600 text-right">
                                    Prorr.: {new Date(c.data_prorrogacao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}

                              </div>
                            </div>

                            <div className="border-t border-slate-850 pt-2 w-full flex flex-wrap gap-1.5">
                              {cItens.map(ci => {
                                const mat = materiais.find(m => m.id_material === ci.id_material);
                                return (
                                  <span key={ci.id_cautela_item} className="text-[8px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-slate-400">
                                    {mat?.modelo} {mat?.controle_quantidade ? `(x${ci.quantidade})` : `(${ci.id_material})`}
                                  </span>
                                );
                              })}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>

                </div>

                {/* Lado Direito: Itens da Cautela Selecionada */}
                <div className="lg:col-span-6 flex flex-col space-y-4 justify-between h-full border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6 overflow-hidden">
                  {returnCautelaId ? (
                    (() => {
                      const selectedCaut = cautelas.find(c => c.id_cautela === returnCautelaId);
                      const pm = usuarios.find(u => u.matricula === selectedCaut?.matricula_policial);
                      const cItens = cautelaItens.filter(ci => ci.id_cautela === returnCautelaId && !ci.estado_devolucao);

                      return (
                        <div className="flex-1 flex flex-col justify-between h-full overflow-hidden">
                          
                          {/* Cabeçalho do Militar Selecionado */}
                          <div className="bg-slate-955/60 p-4 border border-slate-850 rounded-xl space-y-2">
                            <span className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider block">Militar para Descarrego:</span>
                            <div className="flex justify-between items-center font-mono">
                              <div>
                                <p className="text-white uppercase font-sans font-bold text-xs">{pm?.posto_graduacao} {pm?.nome_de_guerra || pm?.nome}</p>
                                <p className="text-[9px] text-slate-500 mt-0.5">RG FUNCIONAL: {selectedCaut?.matricula_policial}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] text-slate-505 block font-bold">GUIA DE RETIRADA</span>
                                <span className="text-blue-450 font-bold font-mono text-[9px]">{selectedCaut?.id_cautela}</span>
                              </div>
                            </div>
                          </div>

                          {/* Listagem de Equipamentos Bélicos */}
                          <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-2.5 max-h-[300px] lg:max-h-[360px]">
                            <span className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider block">Selecione os itens que estão sendo devolvidos:</span>
                            
                            {cItens.map((ci) => {
                              const mat = materiais.find(m => m.id_material === ci.id_material);
                              const isChecked = itemsToReturn.includes(ci.id_material);
                              const currentReturnedQty = returnedQuantities[ci.id_material] ?? ci.quantidade;
                              
                              return (
                                <div
                                  key={ci.id_cautela_item}
                                  className={`p-3 border rounded-xl flex flex-col gap-2.5 transition-all duration-150 ${
                                    isChecked
                                      ? 'bg-blue-600/10 border-blue-500/30 text-white'
                                      : 'bg-slate-950/40 border-slate-850 text-slate-500'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3 w-full">
                                    {/* Checkbox e Detalhes do Material */}
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          if (isChecked) {
                                            setItemsToReturn(prev => prev.filter(id => id !== ci.id_material));
                                          } else {
                                            setItemsToReturn(prev => [...prev, ci.id_material]);
                                          }
                                        }}
                                        className="h-4.5 w-4.5 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950 cursor-pointer"
                                      />
                                      <div>
                                        <h4 className={`text-xs font-bold uppercase font-sans ${isChecked ? 'text-slate-100' : 'text-slate-500'}`}>{mat?.modelo}</h4>
                                        <p className="text-[8px] font-mono text-slate-500">
                                          {mat?.controle_quantidade ? `Item Coletivo (Custódia: ${ci.quantidade} un)` : `SN/CÓDIGO: ${ci.id_material}`}
                                        </p>
                                        {ci.quantidade_carregadores !== undefined && ci.quantidade_carregadores > 0 && (
                                          <div className={`flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded border text-[9px] font-mono font-bold uppercase tracking-wider w-fit ${
                                            isChecked 
                                              ? 'bg-amber-950/20 border-amber-900/30 text-amber-400' 
                                              : 'bg-slate-950/50 border-slate-900 text-slate-550'
                                          }`}>
                                            <span>Devolver {ci.quantidade_carregadores} Carregador(es)</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      {/* Quantidade a devolver se for coletivo e estiver checado */}
                                      {isChecked && mat?.controle_quantidade && (
                                        <div className="space-y-0.5">
                                          <span className="text-[8px] text-slate-500 font-mono font-bold block uppercase tracking-wide">Qtd p/ Devolver:</span>
                                          <div className="flex items-center gap-1 bg-slate-950 border border-slate-855 rounded p-0.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (currentReturnedQty > 0) {
                                                  setReturnedQuantities(prev => ({ ...prev, [ci.id_material]: currentReturnedQty - 1 }));
                                                }
                                              }}
                                              className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white rounded"
                                            >
                                              -
                                            </button>
                                            <span className="text-xs font-mono font-bold text-white px-1">
                                              {currentReturnedQty}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (currentReturnedQty < ci.quantidade) {
                                                  setReturnedQuantities(prev => {
                                                    const nextQty = currentReturnedQty + 1;
                                                    const diff = ci.quantidade - nextQty;
                                                    setConsumedQuantities(cPrev => {
                                                      const currentCons = cPrev[ci.id_material] ?? 0;
                                                      return {
                                                        ...cPrev,
                                                        [ci.id_material]: Math.min(diff, currentCons)
                                                      };
                                                    });
                                                    return { ...prev, [ci.id_material]: nextQty };
                                                  });
                                                }
                                              }}
                                              className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white rounded"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Escolha do Laudo/Estado se estiver marcado */}
                                      {isChecked && (
                                        <div className="space-y-0.5">
                                          <span className="text-[8px] text-slate-500 font-mono font-bold block uppercase tracking-wide">Laudo Físico:</span>
                                          <select
                                            value={claimConditions[ci.id_material] || 'bom'}
                                            onChange={(e) => setClaimConditions(prev => ({
                                              ...prev,
                                              [ci.id_material]: e.target.value as CondicaoUso
                                            }))}
                                            className="bg-[#0a1120] border border-slate-850 rounded px-2 py-1 text-[10px] font-mono text-slate-350 focus:outline-none cursor-pointer"
                                          >
                                            <option value="excelente">Excelente</option>
                                            <option value="bom">Bom (Comum)</option>
                                            <option value="regular">Regular</option>
                                            <option value="avariado">Avariado</option>
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Checkbox para Consumo de Munições/Carregadores (apenas se for controle_quantidade e tiver diferença) */}
                                  {isChecked && mat?.controle_quantidade && currentReturnedQty < ci.quantidade && (
                                    <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded border border-slate-855/60 mt-1">
                                      <input
                                        type="checkbox"
                                        id={`check-consume-${ci.id_material}`}
                                        checked={(consumedQuantities[ci.id_material] ?? 0) === (ci.quantidade - currentReturnedQty)}
                                        onChange={(e) => {
                                          const diff = ci.quantidade - currentReturnedQty;
                                          setConsumedQuantities(prev => ({
                                            ...prev,
                                            [ci.id_material]: e.target.checked ? diff : 0
                                          }));
                                        }}
                                        className="h-3.5 w-3.5 rounded border-slate-800 text-cyan-600 focus:ring-cyan-500 bg-slate-950 cursor-pointer animate-none"
                                      />
                                      <label 
                                        htmlFor={`check-consume-${ci.id_material}`} 
                                        className="text-[9px] font-mono text-cyan-400 font-bold uppercase cursor-pointer select-none leading-none animate-none"
                                      >
                                        Marcar {ci.quantidade - currentReturnedQty} unidades como Consumidas/Disparadas
                                      </label>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Campo de Observações e Confirmação */}
                          <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-850 rounded-xl mt-auto">
                            {/* Checkbox para prorrogamento de cautela */}
                            <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 border border-slate-850 rounded-lg">
                              <input
                                type="checkbox"
                                id="checkbox-prorrogar"
                                checked={prorrogarCautela}
                                onChange={(e) => setProrrogarCautela(e.target.checked)}
                                className="h-4.5 w-4.5 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950 cursor-pointer"
                              />
                              <label htmlFor="checkbox-prorrogar" className="text-[10px] font-mono text-slate-300 font-bold uppercase cursor-pointer select-none">
                                Prorrogar Cautela por mais de 24h (Dotação Estendida)
                              </label>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[8px] text-slate-500 font-mono font-bold block uppercase tracking-wide">Observações do Recebimento Técnico:</label>
                              <textarea
                                rows={2}
                                value={observacoesDevolucao}
                                onChange={(e) => setObservacoesDevolucao(e.target.value)}
                                className="w-full bg-[#0a1120] border border-slate-855 rounded-lg p-2.5 text-xs font-sans text-slate-300 focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            {/* Botão dedicado para salvar a prorrogação */}
                            {prorrogarCautela && (
                              <button
                                type="button"
                                onClick={handleSalvarProrrogacao}
                                className="w-full bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 hover:border-amber-500/60 text-amber-400 hover:text-amber-300 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider font-mono"
                              >
                                <Timer className="h-4 w-4" />
                                <span>Salvar Prorrogação +24h (sem dar baixa)</span>
                              </button>
                            )}

                            <div className="flex gap-2 font-mono">
                              <button
                                type="button"
                                onClick={() => {
                                  setReturnCautelaId('');
                                  setItemsToReturn([]);
                                  setProrrogarCautela(false);
                                }}
                                className="flex-1 bg-transparent hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 py-2.5 rounded-lg text-xs transition-colors cursor-pointer uppercase tracking-wider font-bold"
                              >
                                Limpar PM
                              </button>
                              <button
                                type="button"
                                onClick={handleDevolucaoSubmit}
                                disabled={itemsToReturn.length === 0 && !prorrogarCautela}
                                className={`flex-1 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider ${
                                  (itemsToReturn.length > 0 || prorrogarCautela)
                                    ? 'bg-blue-600 hover:bg-blue-550 text-white cursor-pointer shadow-md glow-blue'
                                    : 'bg-slate-955 border border-slate-850 text-slate-650 cursor-not-allowed'
                                }`}
                              >
                                <FileCheck2 className="h-4 w-4" />
                                <span>Confirmar Baixa</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })()
                  ) : (
                    <div className="bg-slate-950/40 border border-slate-850/80 rounded-xl p-10 flex flex-col items-center justify-center text-center h-full text-slate-500 font-mono text-xs min-h-[300px]">
                      <FileCheck2 className="h-8 w-8 text-slate-800 mb-3" />
                      <p className="max-w-xs leading-relaxed">Selecione um militar na lista à esquerda para analisar seus equipamentos sob custódia e efetuar a baixa.</p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
