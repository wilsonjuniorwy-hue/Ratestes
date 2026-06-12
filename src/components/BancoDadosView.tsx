import React, { useState } from 'react';
import { 
  Database, Search, KeyRound, Package, ShieldAlert, CheckCircle, AlertTriangle, Plus, Lock, X, FolderLock,
  RefreshCw, Trash2, Eye, Play, FileText, Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Usuario, Material, SituacaoMilitar, StatusMaterial, Categoria, Cautela, CautelaItem, ArmaParticular } from '../types';
import { comparePassword } from '../utils/crypto';
import { supabase } from '../supabaseClient';

interface BancoDadosViewProps {
  usuarios: Usuario[];
  materiais: Material[];
  categorias: Categoria[];
  adicionarCategoria: (novaCategoria: Categoria) => void;
  cautelas: Cautela[];
  cautelaItens: CautelaItem[];
  zerarSenha: (matricula: string) => void;
  updatePorte: (matricula: string, novaSituacao: SituacaoMilitar) => void;
  adicionarMaterial: (novoMaterial: Material) => void;
  updateMaterialStatus: (id: string, novoStatus: StatusMaterial) => void;
  confirmarRetirada: (id: string, destino: string, quantidade_retirada?: number) => void;
  modelosArmas: Array<{ modelo: string; calibre: string }>;
  adicionarModeloArma: (modelo: string, calibre: string) => void;
  activeArmeiroMatricula?: string;
  authenticatedPerfil?: string;
  excluirPolicialTotal?: (matricula: string) => Promise<{ success: boolean }>;
  excluirMaterialTotal?: (idMaterial: string) => Promise<{ success: boolean }>;
  armasParticulares: ArmaParticular[];
  adicionarArmaParticular: (novoItem: Omit<ArmaParticular, 'id_particular' | 'data_deposito' | 'status'>) => Promise<void>;
  devolverArmasParticulares: (idsParticulares: string[], matriculaPolicial: string) => Promise<void>;
  editarPolicial?: (matricula: string, dadosAtualizados: Partial<Usuario>) => Promise<{ success: boolean }>;
  filaSincronizacao?: any[];
  removerItemFilaSincronizacao?: (id: number) => Promise<void>;
  forcarSincronizacao?: () => Promise<void>;
  limparFilaSincronizacao?: () => Promise<void>;
  syncQueueErrors?: Record<number, string>;
  isOnline?: boolean;
  isSyncing?: boolean;
}

export function BancoDadosView({
  usuarios,
  materiais,
  categorias,
  adicionarCategoria,
  cautelas,
  cautelaItens,
  zerarSenha,
  updatePorte,
  adicionarMaterial,
  updateMaterialStatus,
  confirmarRetirada,
  modelosArmas,
  adicionarModeloArma,
  activeArmeiroMatricula,
  authenticatedPerfil,
  excluirPolicialTotal,
  excluirMaterialTotal,
  armasParticulares,
  adicionarArmaParticular,
  devolverArmasParticulares,
  editarPolicial,
  filaSincronizacao = [],
  removerItemFilaSincronizacao,
  forcarSincronizacao,
  limparFilaSincronizacao,
  syncQueueErrors = {},
  isOnline = true,
  isSyncing = false
}: BancoDadosViewProps) {
  // --- ESTADOS DA ABA BANCO DE DADOS ---
  const [bancoDadosSubSection, setBancoDadosSubSection] = useState<'policiais' | 'estoque' | 'particulares' | 'sincronizacao'>('policiais');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [stockSearchTerm, setStockSearchTerm] = useState('');

  const [expandedPayloadId, setExpandedPayloadId] = useState<number | null>(null);

  const formatOperacao = (op: string) => {
    switch (op) {
      case 'EFETIVAR_CAUTELA': return 'Cautela Bélica';
      case 'EFETIVAR_DEVOLUCAO': return 'Devolução / Baixa de Cautela';
      case 'SALVAR_OCORRENCIA': return 'Registro de Ocorrência';
      case 'CADASTRAR_SENHA': return 'Alteração / Cadastro de Senha';
      case 'CADASTRAR_POLICIAL': return 'Cadastro de Policial Militar';
      case 'SALVAR_LOG_AUDITORIA': return 'Registro de Log de Auditoria';
      default: return op;
    }
  };

  const getPayloadSummary = (item: any) => {
    try {
      const payload = JSON.parse(item.payload);
      if (item.operacao === 'EFETIVAR_CAUTELA') {
        return `Matrícula: ${payload.matriculaPolicial} | Itens: ${payload.cartItens?.length || 0} equipamentos`;
      }
      if (item.operacao === 'EFETIVAR_DEVOLUCAO') {
        const matCount = payload.idsMateriaisDevolvidos?.length || payload.idsMaterialsDevolvidos?.length || 0;
        return `Cautela ID: ${payload.cautId?.substring(0, 8)}... | Materiais: ${matCount} itens`;
      }
      if (item.operacao === 'CADASTRAR_POLICIAL') {
        return `Matrícula: ${payload.userToInsert?.matricula} | Nome: ${payload.userToInsert?.nome}`;
      }
      if (item.operacao === 'SALVAR_OCORRENCIA') {
        return `Título: ${payload.novaOco?.titulo || 'Ocorrência Sem Título'}`;
      }
      if (item.operacao === 'CADASTRAR_SENHA') {
        return `Matrícula: ${payload.matricula}`;
      }
      if (item.operacao === 'SALVAR_LOG_AUDITORIA') {
        return `Evento: ${payload.logToInsert?.tipo_evento?.toUpperCase()} | Executor: ${payload.logToInsert?.matricula_executor}`;
      }
    } catch (_) {}
    return 'Detalhes indisponíveis.';
  };

  // Estados para Novo Material
  const [newMaterialId, setNewMaterialId] = useState('');
  const [newMaterialCategoria, setNewMaterialCategoria] = useState('');
  const [newMaterialModelo, setNewMaterialModelo] = useState('');
  const [newMaterialFabricante, setNewMaterialFabricante] = useState('');
  const [newMaterialCalibre, setNewMaterialCalibre] = useState('');
  const [newMaterialSpecs, setNewMaterialSpecs] = useState('');
  const [materialSuccess, setMaterialSuccess] = useState('');
  const [materialError, setMaterialError] = useState('');
  const [newMaterialQuantidade, setNewMaterialQuantidade] = useState(1);
  const [newMaterialCarregadores, setNewMaterialCarregadores] = useState(3);

  // Estados Adicionais para Calibres
  const [calibresDisponiveis, setCalibresDisponiveis] = useState<string[]>(['9mm', '.40 S&W', '5.56x45mm NATO']);
  const [customCalibreValue, setCustomCalibreValue] = useState('');

  // --- ESTADOS DE ARMAS PARTICULARES ---
  const [particularMode, setParticularMode] = useState<'menu' | 'cadastro' | 'visualizar'>('menu');
  const [isTotemModalOpen, setIsTotemModalOpen] = useState(false);
  const [totemMatricula, setTotemMatricula] = useState('');
  const [totemSenha, setTotemSenha] = useState('');
  const [totemError, setTotemError] = useState('');
  const [authenticatedPolicial, setAuthenticatedPolicial] = useState<Usuario | null>(null);

  // Estados Formulário Cadastro Particular
  const [partTipoItem, setPartTipoItem] = useState<'arma' | 'colete' | 'municao'>('arma');
  const [partModelo, setPartModelo] = useState('');
  const [partFabricante, setPartFabricante] = useState('');
  const [partCalibre, setPartCalibre] = useState('');
  const [partNumeroSerie, setPartNumeroSerie] = useState('');
  const [partQuantidade, setPartQuantidade] = useState(1);
  const [partCarregadores, setPartCarregadores] = useState(0);
  const [partMuniQtd, setPartMuniQtd] = useState(0);
  const [partObservacoes, setPartObservacoes] = useState('');
  const [partError, setPartError] = useState('');
  const [partSuccess, setPartSuccess] = useState('');

  // Estados Devolução Particular
  const [selectedPolicialMatriculaDevolucao, setSelectedPolicialMatriculaDevolucao] = useState<string | null>(null);
  const [selectedItensDevolucao, setSelectedItensDevolucao] = useState<string[]>([]);
  const [devolucaoSenhaInput, setDevolucaoSenhaInput] = useState('');
  const [devolucaoError, setDevolucaoError] = useState('');
  const [devolucaoSuccess, setDevolucaoSuccess] = useState('');

  // Helpers para identificar tipo de categoria
  const isWeaponCategory = (catId: string) => {
    const cat = categorias.find(c => c.id_categoria === catId);
    if (!cat) return false;
    const nameLower = cat.nome.toLowerCase();
    const idLower = cat.id_categoria.toLowerCase();
    return idLower.includes('arma') || nameLower.includes('arma') || nameLower.includes('fuzil') || nameLower.includes('pistola') || nameLower.includes('espingarda');
  };

  const isAccessoryCategory = (catId: string) => {
    const cat = categorias.find(c => c.id_categoria === catId);
    if (!cat) return false;
    const nameLower = cat.nome.toLowerCase();
    const idLower = cat.id_categoria.toLowerCase();
    return idLower.includes('municao') || nameLower.includes('muni') || nameLower.includes('carregador') || nameLower.includes('acessorio') || nameLower.includes('carg');
  };

  const isWeaponCategorySelected = isWeaponCategory(newMaterialCategoria);
  const isAccessoryCategorySelected = isAccessoryCategory(newMaterialCategoria);
  const isAmmunitionCategorySelected = newMaterialCategoria === 'CAT-MUNICAO';

  // Estados para Vínculo e Modelos Estruturados
  const [selectedWeaponModel, setSelectedWeaponModel] = useState('');
  const [customModelName, setCustomModelName] = useState('');
  const [customModelCaliber, setCustomModelCaliber] = useState('');
  const [targetWeaponId, setTargetWeaponId] = useState('');

  // Estados para Modal de Categoria Dinâmica
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categorySuccess, setCategorySuccess] = useState('');

  // Estados para Modal de Retirada
  const [removalMaterialId, setRemovalMaterialId] = useState<string | null>(null);
  const [removalDestino, setRemovalDestino] = useState('');
  const [removalQuantity, setRemovalQuantity] = useState(1);
  const [removalError, setRemovalError] = useState('');

  // Helper para obter quantidade disponível de itens de controle_quantidade
  const getQuantidadeDisponivel = (mat: Material) => {
    if (!mat.controle_quantidade) return null;
    const cautelasAtivasIds = new Set(cautelas.filter(c => c.status_cautela !== 'devolvida').map(c => c.id_cautela));
    const totalCautelado = cautelaItens
      .filter(ci => ci.id_material === mat.id_material && ci.estado_devolucao === undefined && cautelasAtivasIds.has(ci.id_cautela))
      .reduce((sum, item) => sum + item.quantidade, 0);
    return Math.max(0, (mat.quantidade || 0) - totalCautelado);
  };

  // Handler para criar nova categoria dinamicamente
  const handleAdicionarCategoriaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError('');
    setCategorySuccess('');

    const nameNorm = newCategoryName.trim();
    const descNorm = newCategoryDesc.trim() || 'Sem descrição informada.';

    if (!nameNorm) {
      setCategoryError('Nome da categoria é obrigatório.');
      return;
    }

    const exists = categorias.some(c => c.nome.toLowerCase() === nameNorm.toLowerCase());
    if (exists) {
      setCategoryError('Já existe uma categoria cadastrada com este nome.');
      return;
    }

    const newId = `CAT-${Math.floor(100 + Math.random() * 900)}`;
    const novaCat: Categoria = {
      id_categoria: newId,
      nome: nameNorm,
      descricao: descNorm
    };

    adicionarCategoria(novaCat);
    setCategorySuccess('Categoria cadastrada com sucesso!');
    setNewCategoryName('');
    setNewCategoryDesc('');
    setNewMaterialCategoria(newId);

    setTimeout(() => {
      setIsCategoryModalOpen(false);
      setCategorySuccess('');
    }, 800);
  };

  // ---- CONFIRMAR SENHA ZERADA ----
  const handleZerarSenhaClick = (matricula: string) => {
    const user = usuarios.find(u => u.matricula === matricula);
    if (!user) return;
    if (window.confirm(`Deseja realmente zerar a senha do militar ${user.posto_graduacao} ${user.nome}? Ele deverá cadastrar uma nova senha de 4 dígitos no próximo acesso ao Totem.`)) {
      zerarSenha(matricula);
      alert(`Senha do militar ${user.nome} redefinida com sucesso!`);
    }
  };

  // ---- EXCLUIR POLICIAL CLIQUE (ADMIN) ----
  const handleExcluirPolicialClick = async (matricula: string) => {
    if (!excluirPolicialTotal) return;
    const user = usuarios.find(u => u.matricula === matricula);
    if (!user) return;

    const hasActiveCautelas = cautelas.some(c => c.matricula_policial === matricula && c.status_cautela !== 'devolvida');

    let confirmMsg = `Deseja realmente excluir permanentemente o militar ${user.posto_graduacao} ${user.nome} (${user.matricula}) e todo o seu histórico do banco de dados? Esta ação é irreversível.`;
    if (hasActiveCautelas) {
      confirmMsg = `⚠️ ALERTA CRÍTICO: O militar ${user.posto_graduacao} ${user.nome} possui cautelas ATIVAS com armamento/equipamento em campo! A exclusão irá forçar a devolução simbólica no estoque e remover os históricos. DESEJA REALMENTE CONTINUAR E APAGAR O MILITAR?`;
    }

    if (window.confirm(confirmMsg)) {
      try {
        await excluirPolicialTotal(matricula);
        alert(`Militar ${user.nome} foi completamente excluído do sistema.`);
      } catch (err: any) {
        alert('Erro ao excluir policial: ' + err.message);
      }
    }
  };

  // ---- EXCLUIR MATERIAL CLIQUE (ADMIN) ----
  const handleExcluirMaterialClick = async (idMaterial: string) => {
    if (!excluirMaterialTotal) return;
    const mat = materiais.find(m => m.id_material === idMaterial);
    if (!mat) return;

    const hasActiveCautelas = cautelas.some(c => c.status_cautela !== 'devolvida' && 
      cautelaItens.some(ci => ci.id_cautela === c.id_cautela && ci.id_material === idMaterial && ci.estado_devolucao === undefined)
    );

    let confirmMsg = `Deseja realmente excluir permanentemente o material ${mat.modelo} (S/N: ${mat.id_material}) do estoque do paiol?`;
    if (hasActiveCautelas) {
      confirmMsg = `⚠️ ALERTA CRÍTICO: Este material está em uso (cautelado em campo)! A exclusão apagará o material e os vínculos nas cautelas ativas. DESEJA REALMENTE APAGAR O MATERIAL?`;
    }

    if (window.confirm(confirmMsg)) {
      try {
        await excluirMaterialTotal(idMaterial);
        alert(`Material S/N: ${idMaterial} foi excluído do sistema.`);
      } catch (err: any) {
        alert('Erro ao excluir material: ' + err.message);
      }
    }
  };

  // ---- ADICIONAR NOVO MATERIAL ----
  const handleAdicionarMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMaterialSuccess('');
    setMaterialError('');

    // Se for modelo customizado de arma, cadastrar nas opções do simulador
    if (isWeaponCategorySelected && selectedWeaponModel === 'custom') {
      const modelName = customModelName.trim();
      const modelCal = customModelCaliber.trim();
      if (!modelName || !modelCal) {
        setMaterialError('Nome e calibre do novo modelo são obrigatórios.');
        return;
      }
      adicionarModeloArma(modelName, modelCal);
    }

    // Calcula o calibre correto dependendo da seleção
    let calNorm = newMaterialCalibre.trim() || 'N/A';
    if (calNorm === 'custom' && customCalibreValue.trim()) {
      calNorm = customCalibreValue.trim();
    }

    let idNorm = '';
    let modNorm = '';
    let fabNorm = '';
    let specNorm = '';
    let isQty = false;

    if (isAmmunitionCategorySelected) {
      if (!calNorm || calNorm === 'N/A') {
        setMaterialError('Por favor, selecione o Calibre da munição.');
        return;
      }
      const cleanCal = calNorm.toUpperCase().replace(/[^A-Z0-9]/g, '');
      idNorm = `MUN-${cleanCal}`;
      modNorm = `Munição Calibre ${calNorm}`;
      fabNorm = 'CBC';
      specNorm = `Lote de munições calibre ${calNorm}.`;
      isQty = true;
    } else {
      idNorm = newMaterialId.trim().toUpperCase();
      modNorm = newMaterialModelo.trim();
      fabNorm = 'N/A';
      specNorm = newMaterialSpecs.trim();
      isQty = newMaterialQuantidade > 1;

      if (!idNorm || !modNorm || !newMaterialCategoria) {
        setMaterialError('Preencha todos os campos obrigatórios (*).');
        return;
      }

      if (materiais.some(m => m.id_material.trim().toUpperCase() === idNorm)) {
        setMaterialError('Já existe um item cadastrado com este Número de Série/RFID ou Código.');
        return;
      }
    }

    if (newMaterialQuantidade < 1 || isNaN(newMaterialQuantidade)) {
      setMaterialError('Quantidade de unidades inválida. Deve ser maior ou igual a 1.');
      return;
    }

    // Se o usuário digitou um novo calibre customizado, salvar na lista persistente
    if (newMaterialCalibre === 'custom' && customCalibreValue.trim()) {
      const cleanCustom = customCalibreValue.trim();
      if (!calibresDisponiveis.includes(cleanCustom)) {
        setCalibresDisponiveis(prev => [...prev, cleanCustom]);
      }
    }

    const novoMaterial: Material = {
      id_material: idNorm,
      id_categoria: newMaterialCategoria,
      modelo: modNorm,
      fabricante: fabNorm,
      calibre: calNorm,
      status_atual: 'disponivel',
      data_aquisicao: new Date().toISOString().split('T')[0],
      especificacoes_tecnicas: specNorm || 'Nenhuma especificação informada.',
      controle_quantidade: isQty,
      quantidade: newMaterialQuantidade,
      id_arma_vinculada: !isWeaponCategorySelected && targetWeaponId ? targetWeaponId : undefined,
      ...(isWeaponCategorySelected ? { quantidade_carregadores: newMaterialCarregadores } : {})
    };

    adicionarMaterial(novoMaterial);

    // Resetar campos
    setNewMaterialId('');
    setNewMaterialModelo('');
    setNewMaterialFabricante('');
    setNewMaterialCalibre('');
    setNewMaterialSpecs('');
    setNewMaterialCategoria('');
    setNewMaterialQuantidade(1);
    setNewMaterialCarregadores(3);
    setCustomCalibreValue('');

    // Resetar novos estados de vínculo
    setSelectedWeaponModel('');
    setCustomModelName('');
    setCustomModelCaliber('');
    setTargetWeaponId('');

    setMaterialSuccess('Material bélico adicionado ao estoque com sucesso!');
  };

  // ---- INICIAR RETIRADA ----
  const handleIniciarRetirada = (id: string) => {
    const mat = materiais.find(m => m.id_material === id);
    if (!mat) return;

    if (!mat.controle_quantidade && mat.status_atual === 'cautelado') {
      alert('Não é possível retirar este material do estoque pois ele se encontra cautelado (em campo) por um militar.');
      return;
    }

    const avQty = mat.controle_quantidade ? (getQuantidadeDisponivel(mat) || 0) : 1;
    if (mat.controle_quantidade && avQty === 0) {
      alert('Não há unidades disponíveis em estoque para este lote.');
      return;
    }

    setRemovalMaterialId(id);
    setRemovalDestino('');
    setRemovalQuantity(1);
    setRemovalError('');
  };

  // ---- CONFIRMAR RETIRADA ----
  const handleConfirmarRetiradaSubmit = () => {
    if (!removalMaterialId) return;

    const mat = materiais.find(m => m.id_material === removalMaterialId);
    if (!mat) return;

    const destinoNorm = removalDestino.trim();
    if (!destinoNorm) {
      setRemovalError('Informe o destino ou justificativa da retirada.');
      return;
    }

    if (mat.controle_quantidade) {
      const avQty = getQuantidadeDisponivel(mat) || 0;
      if (removalQuantity < 1 || removalQuantity > avQty) {
        setRemovalError(`Quantidade inválida. Escolha entre 1 e ${avQty}.`);
        return;
      }
    }

    confirmarRetirada(removalMaterialId, destinoNorm, mat.controle_quantidade ? removalQuantity : 1);

    alert(`Material S/N: ${removalMaterialId} retirado do estoque com sucesso.`);
    setRemovalMaterialId(null);
    setRemovalDestino('');
    setRemovalQuantity(1);
    setRemovalError('');
  };

  const handleDesbloquearMilitarClick = async (matricula: string) => {
    if (editarPolicial) {
      const u = usuarios.find(usr => usr.matricula === matricula);
      const nomeGuerra = u?.nome_de_guerra || u?.nome || matricula;
      try {
        await editarPolicial(matricula, { tentativas_login: 0, bloqueado_ate: null });
        alert(`Militar ${nomeGuerra} foi desbloqueado com sucesso!`);
      } catch (err: any) {
        alert('Erro ao desbloquear militar: ' + err.message);
      }
    }
  };

  // ---- HANDLERS DE ARMAS PARTICULARES ----
  const handleTotemAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotemError('');
    const matNorm = totemMatricula.trim().toUpperCase();
    if (!matNorm || !totemSenha) {
      setTotemError('Matrícula e senha são obrigatórias.');
      return;
    }

    try {
      const { data: dbUser, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('matricula', matNorm)
        .is('deletado_em', null)
        .single();

      if (error || !dbUser) {
        setTotemError('Militar não cadastrado no SGBD.');
        return;
      }

      const { matches } = await comparePassword(totemSenha, dbUser.senha_hash);
      if (!matches) {
        setTotemError('Inconsistência cadastral. Senha inválida.');
        return;
      }

      // Success
      setAuthenticatedPolicial(dbUser);
      setParticularMode('cadastro');
      setIsTotemModalOpen(false);
      setTotemMatricula('');
      setTotemSenha('');
    } catch (err) {
      console.error(err);
      setTotemError('Erro na autenticação com o SGBD.');
    }
  };

  const handleCadastroParticular = async (e: React.FormEvent) => {
    e.preventDefault();
    setPartError('');
    setPartSuccess('');

    if (!authenticatedPolicial) {
      setPartError('Nenhum militar autenticado.');
      return;
    }

    if (!partModelo.trim()) {
      setPartError('O modelo é obrigatório.');
      return;
    }

    try {
      const novoItem: Omit<ArmaParticular, 'id_particular' | 'data_deposito' | 'status'> = {
        matricula_policial: authenticatedPolicial.matricula,
        tipo_item: partTipoItem,
        modelo: partModelo.trim(),
        fabricante: partFabricante.trim() || undefined,
        calibre: partTipoItem !== 'colete' ? (partCalibre.trim() || undefined) : undefined,
        numero_serie: partTipoItem !== 'municao' ? (partNumeroSerie.trim() || undefined) : undefined,
        quantidade: partTipoItem === 'municao' ? partQuantidade : 1,
        carregadores: partTipoItem === 'arma' ? partCarregadores : undefined,
        observacoes: partObservacoes.trim() || undefined
      };

      await adicionarArmaParticular(novoItem);
      setPartSuccess(`O equipamento do policial ${authenticatedPolicial.nome} foi registrado com sucesso.`);
      
      // Limpar campos
      setPartModelo('');
      setPartFabricante('');
      setPartCalibre('');
      setPartNumeroSerie('');
      setPartQuantidade(1);
      setPartCarregadores(0);
      setPartObservacoes('');
    } catch (err: any) {
      setPartError('Erro ao cadastrar: ' + err.message);
    }
  };

  const handleDevolucaoParticular = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevolucaoError('');
    setDevolucaoSuccess('');

    if (!selectedPolicialMatriculaDevolucao) return;
    if (selectedItensDevolucao.length === 0) {
      setDevolucaoError('Selecione pelo menos um item para devolver.');
      return;
    }
    if (!devolucaoSenhaInput) {
      setDevolucaoError('Digite a senha para autorizar a devolução.');
      return;
    }

    try {
      // Obter senha do militar
      const { data: dbUser, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('matricula', selectedPolicialMatriculaDevolucao)
        .is('deletado_em', null)
        .single();

      if (error || !dbUser) {
        setDevolucaoError('Falha ao autenticar militar no SGBD.');
        return;
      }

      const { matches } = await comparePassword(devolucaoSenhaInput, dbUser.senha_hash);
      if (!matches) {
        setDevolucaoError('Senha individual de assinatura digital incorreta.');
        return;
      }

      // Proceder com a devolução
      await devolverArmasParticulares(selectedItensDevolucao, selectedPolicialMatriculaDevolucao);
      setDevolucaoSuccess('Armamento devolvido e assinatura digital validada!');
      
      setTimeout(() => {
        setDevolucaoSuccess('');
        setSelectedPolicialMatriculaDevolucao(null);
        setSelectedItensDevolucao([]);
        setDevolucaoSenhaInput('');
      }, 1500);
    } catch (err: any) {
      setDevolucaoError('Erro na devolução: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="arm-banco-dados-view">
      
      {/* Barra de Controle Interno */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 shadow-lg">
        <div className="space-y-1">
          <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <Database className="h-4.5 w-4.5 text-blue-505 glow-blue" />
            <span>Banco de Dados da Reserva</span>
          </h3>
          <p className="text-xs text-slate-455 font-sans">Administração integrada do efetivo militar e controle de estoque bélico permanente.</p>
        </div>
        
        {/* Abas Internas */}
        <div className="flex gap-2 bg-slate-950 p-1 border border-slate-850 rounded-lg">
          <button
            onClick={() => setBancoDadosSubSection('policiais')}
            className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
              bancoDadosSubSection === 'policiais'
                ? 'bg-blue-600/10 text-white border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            POLICIAIS CADASTRADOS
          </button>
          <button
            onClick={() => setBancoDadosSubSection('estoque')}
            className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
              bancoDadosSubSection === 'estoque'
                ? 'bg-blue-600/10 text-white border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            ESTOQUE DA RESERVA
          </button>
          <button
            onClick={() => setBancoDadosSubSection('particulares')}
            className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
              bancoDadosSubSection === 'particulares'
                ? 'bg-blue-600/10 text-white border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            ARMAS PARTICULARES
          </button>
          <button
            onClick={() => setBancoDadosSubSection('sincronizacao')}
            className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer relative ${
              bancoDadosSubSection === 'sincronizacao'
                ? 'bg-blue-600/10 text-white border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            FILA DE SINCRONIZAÇÃO
            {filaSincronizacao.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] font-sans px-1.5 py-0.5 rounded-full animate-pulse font-black shadow-[0_0_8px_rgba(225,29,72,0.6)]">
                {filaSincronizacao.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CONTEÚDO: POLICIAIS CADASTRADOS */}
      {bancoDadosSubSection === 'policiais' && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="relative max-w-md w-full">
              <input
                type="text"
                placeholder="Pesquisar militar por nome, guerra ou matrícula..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-805 rounded-lg py-2.5 pl-9 pr-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
              <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-550" />
            </div>
            <div className="text-[10px] font-mono text-slate-455 uppercase font-bold tracking-wider">
              Policiais no SGBD: <span className="text-white font-black">{usuarios.filter(u => u.perfil === 'policial').length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-355">
              <thead className="bg-[#0b1329]/65 border border-slate-850 text-slate-455 font-mono text-[9px] uppercase tracking-wider">
                <tr>
                  <th className="p-4">Matrícula (RG)</th>
                  <th className="p-4">Nome de Guerra / Completo</th>
                  <th className="p-4">Graduação</th>
                  <th className="p-4">Situação do Porte / Cautela</th>
                  <th className="p-4">Ação Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50 font-sans text-xs">
                {usuarios
                  .filter(u => u.perfil === 'policial')
                  .filter(u => 
                    u.nome.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    u.matricula.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    (u.nome_de_guerra && u.nome_de_guerra.toLowerCase().includes(userSearchTerm.toLowerCase()))
                  )
                  .map((user) => {
                    const isLocked = user.bloqueado_ate && new Date(user.bloqueado_ate) > new Date();
                    return (
                      <tr key={user.matricula} className="hover:bg-slate-900/25 transition-colors">
                        <td className="p-4 font-mono font-bold text-blue-400">{user.matricula}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">{user.nome_de_guerra || 'N/A'}</span>
                              {isLocked && (
                                <span className="text-[8px] bg-red-950/60 text-red-400 border border-red-900/30 px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1" title="Bloqueado por excesso de tentativas de senha">
                                  <Lock className="h-2 w-2" />
                                  <span>Bloqueado</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">{user.nome}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={user.posto_graduacao}
                            onChange={async (e) => {
                              if (editarPolicial) {
                                try {
                                  await editarPolicial(user.matricula, { posto_graduacao: e.target.value });
                                } catch (err: any) {
                                  alert('Erro ao atualizar posto/graduação: ' + err.message);
                                }
                              }
                            }}
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            {['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel'].map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4">
                          <select
                            value={user.situacao_cautela}
                            onChange={(e) => updatePorte(user.matricula, e.target.value as SituacaoMilitar)}
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="apto">Apto (Ativo)</option>
                            <option value="suspenso">Suspenso</option>
                            <option value="restrito_servico">Restrito ao Serviço</option>
                            <option value="pendente_devolucao">Pendente Devolução</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleZerarSenhaClick(user.matricula)}
                              className="px-3 py-1.5 bg-slate-955 hover:bg-amber-955/20 border border-slate-800 hover:border-amber-900/50 text-[10px] font-mono text-slate-400 hover:text-amber-400 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer uppercase font-bold"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              <span>Zerar Senha</span>
                            </button>

                            {isLocked && (
                              <button
                                onClick={() => handleDesbloquearMilitarClick(user.matricula)}
                                className="px-3 py-1.5 bg-slate-955 hover:bg-emerald-955/20 border border-slate-800 hover:border-emerald-900/50 text-[10px] font-mono text-slate-400 hover:text-emerald-400 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer uppercase font-bold"
                              >
                                <Lock className="h-3.5 w-3.5" />
                                <span>Desbloquear</span>
                              </button>
                            )}
                            
                            {authenticatedPerfil === 'admin' && (
                              <button
                                onClick={() => handleExcluirPolicialClick(user.matricula)}
                                className="px-3 py-1.5 bg-slate-955 hover:bg-red-955/20 border border-slate-800 hover:border-red-900/50 text-[10px] font-mono text-slate-400 hover:text-red-400 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer uppercase font-bold"
                              >
                                <span>Excluir</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {usuarios.filter(u => u.perfil === 'policial').length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-505 font-mono text-xs">
                      Nenhum policial militar cadastrado no banco simulador.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTEÚDO: ESTOQUE DA RESERVA */}
      {bancoDadosSubSection === 'estoque' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Formulário lateral de cadastro */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
              <div className="border-b border-slate-850 pb-3 flex items-center gap-2">
                <Package className="h-4.5 w-4.5 text-blue-505" />
                <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">Incluir Equipamento Bélico</h3>
              </div>

              <form onSubmit={handleAdicionarMaterialSubmit} className="space-y-3.5 font-sans text-xs">
                {/* Categoria Regulamentar (Sempre Primeiro) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Categoria Regulamentar *:</label>
                  <div className="flex gap-2">
                    <select
                      required
                      value={newMaterialCategoria}
                      onChange={(e) => {
                        setNewMaterialCategoria(e.target.value);
                        // Reset dynamic states
                        setNewMaterialId('');
                        setNewMaterialModelo('');
                        setNewMaterialFabricante('');
                        setNewMaterialCalibre('');
                        setSelectedWeaponModel('');
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg cursor-pointer font-mono"
                    >
                      <option value="">-- Escolha a categoria --</option>
                      {categorias.map(cat => (
                        <option key={cat.id_categoria} value={cat.id_categoria}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryError('');
                        setCategorySuccess('');
                        setIsCategoryModalOpen(true);
                      }}
                      className="bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 text-blue-400 p-2.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      title="Nova Categoria"
                    >
                      <Plus className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                {isAmmunitionCategorySelected ? (
                  /* Form de Munição */
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Calibre *:</label>
                      <select
                        value={newMaterialCalibre}
                        required
                        onChange={(e) => setNewMaterialCalibre(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="">Selecione o Calibre...</option>
                        {calibresDisponiveis.map(cal => (
                          <option key={cal} value={cal}>{cal}</option>
                        ))}
                        <option value="custom">+ Adicionar Outro Calibre...</option>
                      </select>

                      {newMaterialCalibre === 'custom' && (
                        <div className="space-y-1.5 animate-fadeIn">
                          <input
                            type="text"
                            required
                            placeholder="Digite o novo calibre (ex: .38 SPL)"
                            value={customCalibreValue}
                            onChange={(e) => setCustomCalibreValue(e.target.value)}
                            className="w-full bg-slate-955 border border-slate-800 focus:border-blue-550 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-550/20"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Quantidade a Adicionar *:</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={newMaterialQuantidade}
                        onChange={(e) => setNewMaterialQuantidade(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs font-mono text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </>
                ) : isWeaponCategorySelected ? (
                  /* Form de Armas */
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">
                        Número de Série *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="EX: TX-903831"
                        value={newMaterialId}
                        onChange={(e) => setNewMaterialId(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs font-mono text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Selecione o Modelo/Nome da Arma *:</label>
                      <select
                        required
                        value={selectedWeaponModel}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedWeaponModel(val);
                          if (val && val !== 'custom') {
                            setNewMaterialModelo(val);
                            const found = modelosArmas.find(m => m.modelo === val);
                            if (found) {
                              setNewMaterialCalibre(found.calibre);
                            }
                          } else {
                            setNewMaterialModelo('');
                            setNewMaterialCalibre('');
                          }
                        }}
                        className="w-full bg-[#0a1120] border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg cursor-pointer font-mono"
                      >
                        <option value="">-- Selecione o Modelo de Arma --</option>
                        {modelosArmas.map(m => (
                          <option key={m.modelo} value={m.modelo}>
                            {m.modelo} (Calibre: {m.calibre})
                          </option>
                        ))}
                        <option value="custom">+ Adicionar Novo Modelo...</option>
                      </select>
                    </div>

                    {selectedWeaponModel === 'custom' && (
                      <div className="space-y-3 p-3 bg-slate-950/40 border border-slate-850/80 rounded-xl animate-fadeIn">
                        <span className="text-[9px] text-blue-400 font-mono font-bold uppercase tracking-wider block border-b border-slate-900 pb-1">
                          Definição do Novo Modelo
                        </span>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Nome do Modelo *:</label>
                          <input
                            type="text"
                            required
                            placeholder="EX: PISTOLA CZ - P10"
                            value={customModelName}
                            onChange={(e) => {
                              setCustomModelName(e.target.value);
                              setNewMaterialModelo(e.target.value);
                            }}
                            className="w-full bg-[#0a1120] border border-slate-850 p-2 text-xs text-slate-200 focus:outline-none rounded"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Calibre *:</label>
                          <input
                            type="text"
                            required
                            placeholder="EX: 9mm, 5.56mm, 12"
                            value={customModelCaliber}
                            onChange={(e) => {
                              setCustomModelCaliber(e.target.value);
                              setNewMaterialCalibre(e.target.value);
                            }}
                            className="w-full bg-[#0a1120] border border-slate-850 p-2 text-xs text-slate-200 focus:outline-none rounded"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Calibre *:</label>
                      <input
                        type="text"
                        disabled
                        value={newMaterialCalibre || 'Selecione o modelo de arma acima'}
                        className="w-full bg-slate-955/50 border border-slate-800 p-2.5 text-xs text-slate-400 rounded-lg cursor-not-allowed font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Quantidade de Carregadores *:</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={newMaterialCarregadores}
                        onChange={(e) => setNewMaterialCarregadores(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs font-mono text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Especificações Técnicas:</label>
                      <textarea
                        rows={3}
                        placeholder="Especificações de engenharia militar do item..."
                        value={newMaterialSpecs}
                        onChange={(e) => setNewMaterialSpecs(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </>
                ) : (
                  /* Form Geral ( HT, Colete, etc. ) */
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">
                        Número de Série / Código Identificador *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="EX: SFK54029 ou HT-552"
                        value={newMaterialId}
                        onChange={(e) => setNewMaterialId(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs font-mono text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Unidades do Item *:</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={newMaterialQuantidade}
                        onChange={(e) => setNewMaterialQuantidade(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs font-mono text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Nome para Visualização *:</label>
                      <input
                        type="text"
                        required
                        placeholder="EX: Colete Kevlar Nivel III"
                        value={newMaterialModelo}
                        onChange={(e) => setNewMaterialModelo(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Calibre:</label>
                      <select
                        value={newMaterialCalibre}
                        onChange={(e) => setNewMaterialCalibre(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="N/A">N/A (Não Aplicável)</option>
                        {calibresDisponiveis.map(cal => (
                          <option key={cal} value={cal}>{cal}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Especificações Técnicas:</label>
                      <textarea
                        rows={3}
                        placeholder="Especificações de engenharia militar do item..."
                        value={newMaterialSpecs}
                        onChange={(e) => setNewMaterialSpecs(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </>
                )}

                {materialError && (
                  <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{materialError}</span>
                  </div>
                )}

                {materialSuccess && (
                  <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-lg text-xs text-emerald-450 font-mono flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-455" />
                    <span>{materialSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-2.5 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider cursor-pointer glow-blue"
                >
                  Cadastrar em Carga
                </button>
              </form>
            </div>
          </div>

          {/* Listagem de Estoque */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="relative max-w-sm w-full">
                  <input
                    type="text"
                    placeholder="Filtrar estoque por nome, serial ou especificações..."
                    value={stockSearchTerm}
                    onChange={(e) => setStockSearchTerm(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-xs font-mono text-slate-202 focus:outline-none focus:border-blue-505 focus:ring-1 focus:ring-blue-505/20"
                  />
                  <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-550" />
                </div>
                <div className="text-[10px] font-mono text-slate-455 uppercase font-bold tracking-wider">
                  Itens Totais: <span className="text-white font-black">{materiais.length}</span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[510px] overflow-y-auto pr-1">
                <table className="w-full text-left text-xs text-slate-350">
                  <thead className="bg-[#0b1329]/65 border border-slate-850 text-slate-455 font-mono text-[9px] uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="p-4">Código / Categoria</th>
                      <th className="p-4">Nome de Visualização</th>
                      <th className="p-4">Status no Paiol</th>
                      <th className="p-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50 font-sans text-xs">
                    {materiais
                      .filter(m => 
                        m.modelo.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
                        m.id_material.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
                        m.fabricante.toLowerCase().includes(stockSearchTerm.toLowerCase())
                      )
                      .map((mat) => {
                        const isCautelado = mat.status_atual === 'cautelado';
                        const isRetirado = mat.status_atual === 'retirado';
                        const isQtyControlled = mat.controle_quantidade;
                        const qtyDisp = getQuantidadeDisponivel(mat);
                        const totalQty = mat.quantidade;

                        return (
                          <tr key={mat.id_material} className={`hover:bg-slate-900/25 transition-colors ${isRetirado ? 'opacity-40' : ''}`}>
                            <td className="p-4 font-mono">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-blue-400">{mat.id_material}</span>
                                  {isQtyControlled && (
                                    <span className="text-[7px] font-mono px-1 py-0.5 bg-purple-950/40 text-purple-400 border border-purple-800/40 rounded font-black uppercase tracking-wider">Lote</span>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-500 uppercase mt-0.5">{mat.id_categoria.replace('CAT-', '')}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-205 uppercase">{mat.modelo}</span>
                                <span className="text-[10px] text-slate-550 font-mono mt-0.5">
                                  {mat.fabricante && mat.fabricante !== 'N/A' ? `${mat.fabricante} ` : ''}
                                  {mat.calibre !== 'N/A' && mat.calibre ? `[Calibre: ${mat.calibre}]` : ''}
                                </span>
                                {mat.quantidade_carregadores !== undefined && (
                                  <span className="text-[9px] text-amber-450 font-mono font-bold uppercase tracking-wider mt-1 block bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/20 w-fit">
                                    Carregadores: {mat.quantidade_carregadores}
                                  </span>
                                )}
                                {mat.id_arma_vinculada && (
                                  <span className="text-[9px] text-cyan-400 font-mono font-bold uppercase tracking-wider mt-1 block bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-900/20 w-fit">
                                    Vínculo: Arma S/N {mat.id_arma_vinculada}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {isQtyControlled ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className={`text-xs font-mono font-black ${qtyDisp && qtyDisp > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {qtyDisp} / {totalQty} un
                                  </span>
                                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wide">disponíveis</span>
                                </div>
                              ) : isCautelado || isRetirado ? (
                                <span className={`text-[8px] font-mono font-black uppercase px-2.5 py-1 rounded border ${
                                  isCautelado
                                    ? 'bg-blue-955/40 text-blue-450 border-blue-900/30'
                                    : 'bg-slate-950 text-slate-500 border-slate-900'
                                }`}>
                                  {mat.status_atual}
                                </span>
                              ) : (
                                <select
                                  value={mat.status_atual}
                                  onChange={(e) => updateMaterialStatus(mat.id_material, e.target.value as StatusMaterial)}
                                  className="bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-205 focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                  <option value="disponivel">Disponível</option>
                                  <option value="indisponivel">Indisponível</option>
                                  <option value="danificado">Danificado</option>
                                  <option value="manutencao">Em Manutenção</option>
                                  <option value="condenado">Condenado</option>
                                </select>
                              )}
                            </td>
                            <td className="p-4">
                               <div className="flex items-center gap-2">
                                 {isQtyControlled ? (
                                   <button
                                     onClick={() => handleIniciarRetirada(mat.id_material)}
                                     disabled={qtyDisp === 0}
                                     className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all duration-150 flex items-center justify-center font-bold uppercase cursor-pointer ${
                                       qtyDisp === 0
                                         ? 'bg-slate-955 border border-slate-850 text-slate-655 cursor-not-allowed opacity-40'
                                         : 'bg-red-955/30 border border-red-900/30 hover:border-red-800/80 text-red-400 hover:text-red-300'
                                     }`}
                                   >
                                     Retirar
                                   </button>
                                 ) : !isRetirado ? (
                                   <button
                                     onClick={() => handleIniciarRetirada(mat.id_material)}
                                     disabled={isCautelado}
                                     className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all duration-150 flex items-center justify-center font-bold uppercase cursor-pointer ${
                                       isCautelado
                                         ? 'bg-slate-950 border border-slate-850 text-slate-650 cursor-not-allowed opacity-40'
                                         : 'bg-red-955/30 border border-red-900/30 hover:border-red-800/80 text-red-400 hover:text-red-300'
                                     }`}
                                   >
                                     Retirar
                                   </button>
                                 ) : (
                                   <span className="text-[9px] font-mono text-slate-500 italic font-bold">Item Fora</span>
                                 )}

                                 {authenticatedPerfil === 'admin' && (
                                   <button
                                     onClick={() => handleExcluirMaterialClick(mat.id_material)}
                                     className="px-3 py-1.5 bg-slate-955 hover:bg-red-955/20 border border-slate-800 hover:border-red-900/50 text-[10px] font-mono text-slate-400 hover:text-red-400 rounded-lg transition-colors flex items-center justify-center font-bold uppercase cursor-pointer"
                                   >
                                     Excluir
                                   </button>
                                 )}
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* CONTEÚDO: ARMAS PARTICULARES */}
      {bancoDadosSubSection === 'particulares' && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-6">
          <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <FolderLock className="h-4.5 w-4.5 text-blue-500" />
                <span>Custódia de Armas Particulares</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans">Depósito provisório e restituição de armamento pessoal de militares na reserva bélica.</p>
            </div>
            
            {particularMode !== 'menu' && (
              <button
                onClick={() => {
                  setParticularMode('menu');
                  setAuthenticatedPolicial(null);
                  setPartError('');
                  setPartSuccess('');
                }}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer uppercase font-bold"
              >
                Voltar ao Menu
              </button>
            )}
          </div>

          {/* MODO MENU */}
          {particularMode === 'menu' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div 
                onClick={() => {
                  setTotemMatricula('');
                  setTotemSenha('');
                  setTotemError('');
                  setIsTotemModalOpen(true);
                }}
                className="bg-slate-955/40 hover:bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 p-6 rounded-xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group text-left shadow-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.05)]"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform duration-300">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold font-mono text-slate-200 uppercase">Cadastrar Novo Depósito Particular</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">Receber arma de fogo, colete balístico ou munições particulares de militares. Exige a matrícula e a senha de assinatura digital do proprietário no Totem.</p>
                </div>
                <span className="text-[10px] font-mono text-blue-400 font-bold group-hover:translate-x-1.5 transition-transform duration-200 block uppercase tracking-wider font-black">Acessar Totem & Cadastro →</span>
              </div>

              <div 
                onClick={() => setParticularMode('visualizar')}
                className="bg-slate-955/40 hover:bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 p-6 rounded-xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group text-left shadow-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.05)]"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450 group-hover:scale-105 transition-transform duration-300">
                    <FolderLock className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold font-mono text-slate-200 uppercase">Visualizar Armas e Devolver</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">Consultar todo o acervo particular que se encontra acautelado no paiol e realizar a devolução total ou parcial com validação de senha do militar.</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold group-hover:translate-x-1.5 transition-transform duration-200 block uppercase tracking-wider font-black">Consultar Inventário →</span>
              </div>
            </div>
          )}

          {/* MODO CADASTRO (FORMULÁRIO) */}
          {particularMode === 'cadastro' && authenticatedPolicial && (
            <div className="max-w-2xl mx-auto w-full space-y-6">
              {/* Banner Identificador do Militar */}
              <div className="bg-blue-955/25 border border-blue-900/35 p-4 rounded-xl flex items-center justify-between font-mono text-xs shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-600/10 border border-blue-500/30 rounded-lg flex items-center justify-center text-blue-400">
                    <CheckCircle className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Militar Proprietário Autenticado:</span>
                    <strong className="text-slate-200 font-sans text-xs uppercase">{authenticatedPolicial.posto_graduacao} {authenticatedPolicial.nome}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block font-mono">Matrícula:</span>
                  <span className="text-blue-400 font-bold text-xs font-mono">{authenticatedPolicial.matricula}</span>
                </div>
              </div>

              <form onSubmit={handleCadastroParticular} className="space-y-4 font-sans text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Tipo de Item */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide block">Tipo de Equipamento *:</label>
                    <select
                      required
                      value={partTipoItem}
                      onChange={(e) => {
                        setPartTipoItem(e.target.value as any);
                        setPartModelo('');
                        setPartFabricante('');
                        setPartCalibre('');
                        setPartNumeroSerie('');
                        setPartQuantidade(1);
                        setPartCarregadores(0);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg cursor-pointer font-mono"
                    >
                      <option value="arma">Arma de Fogo</option>
                      <option value="colete">Colete Balístico</option>
                      <option value="municao">Munições (Lote)</option>
                    </select>
                  </div>

                  {/* Modelo */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide block">
                      {partTipoItem === 'arma' ? 'Modelo da Arma *' : partTipoItem === 'colete' ? 'Tamanho / Modelo do Colete *' : 'Identificação da Munição *'}:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={partTipoItem === 'arma' ? 'Ex: Glock G17 Gen 5' : partTipoItem === 'colete' ? 'Ex: Colete Inbra IIIA M' : 'Ex: Munição 9mm Gold Flat'}
                      value={partModelo}
                      onChange={(e) => setPartModelo(e.target.value)}
                      className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-205 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Fabricante */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide block">Fabricante / Marca:</label>
                    <input
                      type="text"
                      placeholder="Ex: Taurus, CBC, Glock, Inbra"
                      value={partFabricante}
                      onChange={(e) => setPartFabricante(e.target.value)}
                      className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-205 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Calibre (Apenas para Arma e Munição) */}
                  {partTipoItem !== 'colete' && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide block">Calibre *:</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 9mm, .40 S&W, .38 SPL, 12"
                        value={partCalibre}
                        onChange={(e) => setPartCalibre(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-205 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  )}

                  {/* Número de Série (Apenas para Arma e Colete) */}
                  {partTipoItem !== 'municao' && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Número de Série / Código *:</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: ABD837482"
                        value={partNumeroSerie}
                        onChange={(e) => setPartNumeroSerie(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs font-mono text-slate-205 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  )}

                  {/* Quantidade (Apenas para Munição) */}
                  {partTipoItem === 'municao' && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide block">Quantidade de Cartuchos *:</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={partQuantidade}
                        onChange={(e) => setPartQuantidade(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs font-mono text-slate-205 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  )}

                  {/* Quantidade de Carregadores (Apenas para Arma) */}
                  {partTipoItem === 'arma' && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide block">Quantidade de Carregadores:</label>
                      <input
                        type="number"
                        min={0}
                        value={partCarregadores}
                        onChange={(e) => setPartCarregadores(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs font-mono text-slate-205 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  )}
                </div>

                {/* Observações */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide block">Observações / Detalhes de Conservação:</label>
                  <textarea
                    rows={3}
                    placeholder="Descreva o estado do armamento, quantidade de munições no carregador, ou observações gerais..."
                    value={partObservacoes}
                    onChange={(e) => setPartObservacoes(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-205 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                {partError && (
                  <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{partError}</span>
                  </div>
                )}

                {partSuccess ? (
                  <div className="space-y-4 bg-emerald-950/20 border border-emerald-900/40 p-5 rounded-xl text-xs font-mono animate-fadeIn">
                    <div className="flex items-start gap-2 text-emerald-450">
                      <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-emerald-455" />
                      <div>
                        <strong className="text-white block uppercase">Depósito Registrado</strong>
                        <span>{partSuccess}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          // Limpa feedback
                          setPartSuccess('');
                          setPartError('');
                          // Limpa campos do formulário para o próximo item
                          setPartTipoItem('arma');
                          setPartModelo('');
                          setPartFabricante('');
                          setPartCalibre('');
                          setPartNumeroSerie('');
                          setPartQuantidade(1);
                          setPartCarregadores(0);
                          setPartMuniQtd(0);
                          setPartObservacoes('');
                        }}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-555 text-white font-bold rounded-lg transition-colors cursor-pointer uppercase text-[10px]"
                      >
                        Cadastrar outro item para este policial
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPartSuccess('');
                          setPartError('');
                          setParticularMode('menu');
                          setAuthenticatedPolicial(null);
                          setTotemMatricula('');
                          setTotemSenha('');
                          setTotemError('');
                          setIsTotemModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold rounded-lg transition-colors cursor-pointer uppercase text-[10px]"
                      >
                        Voltar para tela de login
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-3 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider cursor-pointer glow-blue"
                  >
                    Cadastrar em Custódia Particular
                  </button>
                )}
              </form>
            </div>
          )}

          {/* MODO VISUALIZAR (LISTAGEM DE CUSTÓDIA) */}
          {particularMode === 'visualizar' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="overflow-x-auto pr-1">
                <table className="w-full text-left text-xs text-slate-350">
                  <thead className="bg-[#0b1329]/65 border border-slate-850 text-slate-455 font-mono text-[9px] uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Proprietário (Militar)</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4">Armamento / Equipamento Particular</th>
                      <th className="p-4">Data Depósito</th>
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50 font-sans text-xs">
                    {(() => {
                      const activeItems = armasParticulares.filter(ap => ap.status === 'guardado');
                      if (activeItems.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-505 font-mono text-xs">
                              Nenhuma arma ou item particular sob custódia no paiol no momento.
                            </td>
                          </tr>
                        );
                      }

                      return activeItems.map((item) => {
                        const policial = usuarios.find(u => u.matricula === item.matricula_policial);
                        return (
                          <tr key={item.id_particular} className="hover:bg-slate-900/25 transition-colors">
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-205">
                                  {policial?.posto_graduacao} {policial?.nome_de_guerra || policial?.nome}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono mt-0.5">Matrícula: {item.matricula_policial}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                                item.tipo_item === 'arma'
                                  ? 'bg-blue-955/35 text-blue-400 border-blue-900/40'
                                  : item.tipo_item === 'colete'
                                  ? 'bg-purple-955/35 text-purple-400 border-purple-900/40'
                                  : 'bg-amber-955/35 text-amber-400 border-amber-900/40'
                              }`}>
                                {item.tipo_item === 'arma' ? 'Arma' : item.tipo_item === 'colete' ? 'Colete' : 'Munição'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col font-sans">
                                <span className="font-bold text-slate-205 uppercase">{item.modelo}</span>
                                <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {item.fabricante && `Fabricante: ${item.fabricante}`}
                                  {item.calibre && ` | Calibre: ${item.calibre}`}
                                  {item.numero_serie && ` | S/N: ${item.numero_serie}`}
                                  {item.quantidade && item.tipo_item === 'municao' && ` | Quantidade: ${item.quantidade} un`}
                                  {item.carregadores !== undefined && item.carregadores > 0 && ` | Carregadores: ${item.carregadores}`}
                                </span>
                                {item.observacoes && (
                                  <span className="text-[9px] text-slate-505 italic mt-1 font-mono">Obs: {item.observacoes}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-mono text-[10px] text-slate-400">
                              {new Date(item.data_deposito).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedPolicialMatriculaDevolucao(item.matricula_policial);
                                  setSelectedItensDevolucao([item.id_particular]); // Seleciona esse item
                                  setDevolucaoSenhaInput('');
                                  setDevolucaoError('');
                                  setDevolucaoSuccess('');
                                }}
                                className="px-3 py-1.5 bg-emerald-950/20 hover:bg-emerald-950/45 border border-emerald-900/30 hover:border-emerald-800/80 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 mx-auto font-bold uppercase cursor-pointer"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                <span>Devolver</span>
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE JUSTIFICATIVA DE RETIRADA */}
      <AnimatePresence>
        {removalMaterialId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs font-sans relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500" />
              
              <div className="flex items-start gap-3">
                <div className="bg-red-955/40 p-2.5 rounded-lg border border-red-900/30 text-red-505">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-widest">Retirar Item do Estoque</h3>
                  <p className="text-xs text-slate-450 leading-relaxed mt-0.5 font-medium">Forneça justificativa técnica ou destino detalhado para a saída em carga deste material.</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850/80 font-mono text-[10px] space-y-1.5">
                <p className="text-slate-400">Material: <strong className="text-slate-205 font-sans font-black">{materiais.find(m => m.id_material === removalMaterialId)?.modelo}</strong></p>
                <p className="text-slate-400">
                  {materiais.find(m => m.id_material === removalMaterialId)?.controle_quantidade ? 'Código do Lote:' : 'Número de Série:'}{' '}
                  <strong className="text-blue-400 font-bold">{removalMaterialId}</strong>
                </p>
              </div>

              {(() => {
                const mat = materiais.find(m => m.id_material === removalMaterialId);
                if (!mat?.controle_quantidade) return null;
                const avQty = getQuantidadeDisponivel(mat) || 0;
                
                return (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wider block">Quantidade a Retirar (Max: {avQty}) *:</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={avQty}
                      value={removalQuantity}
                      onChange={(e) => setRemovalQuantity(Math.min(avQty, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                    />
                  </div>
                );
              })()}

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wider block">Destino / Justificativa *:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Enviado para a Diretoria de Apoio Logístico (DAL) para manutenção corretiva profunda ou descarte por obsolescência."
                  value={removalDestino}
                  onChange={(e) => setRemovalDestino(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              {removalError && (
                <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-550" />
                  <span>{removalError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 font-mono">
                <button
                  type="button"
                  onClick={() => setRemovalMaterialId(null)}
                  className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-transparent text-slate-400 hover:text-slate-200 rounded-lg transition-colors font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarRetiradaSubmit}
                  className="px-4 py-2 bg-red-650 hover:bg-red-500 text-white rounded-lg transition-colors font-bold uppercase cursor-pointer shadow-md glow-red"
                >
                  Confirmar Retirada
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PARA NOVA CATEGORIA */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs font-sans relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-955/40 p-2.5 rounded-lg border border-blue-900/30 text-blue-400">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-widest">Nova Categoria Regulamentar</h3>
                  <p className="text-xs text-slate-450 leading-relaxed mt-0.5 font-medium">Cadastre uma nova categoria de material para organizar o paiol e disponibilizar no totem.</p>
                </div>
              </div>

              <form onSubmit={handleAdicionarCategoriaSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wider block">Nome da Categoria *:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Armas Não-Letais, Baterias, Bandoleiras"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wider block">Descrição / Detalhes:</label>
                  <textarea
                    rows={2}
                    placeholder="Descrição breve sobre quais itens entram nesta categoria..."
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-205 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                {categoryError && (
                  <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-550" />
                    <span>{categoryError}</span>
                  </div>
                )}

                {categorySuccess && (
                  <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-lg text-xs text-emerald-450 font-mono flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-455" />
                    <span>{categorySuccess}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 font-mono">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-transparent text-slate-400 hover:text-slate-200 rounded-lg transition-colors font-bold uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-550 text-white rounded-lg transition-colors font-bold uppercase cursor-pointer shadow-md glow-blue"
                  >
                    Salvar Categoria
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE TOTEM DE AUTENTICAÇÃO (CADASTRO PARTICULAR) */}
      <AnimatePresence>
        {isTotemModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs font-sans relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-955/40 p-2.5 rounded-lg border border-blue-900/30 text-blue-450">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-widest">Totem de Identificação Tática</h3>
                  <p className="text-xs text-slate-450 leading-relaxed mt-0.5 font-medium">O militar proprietário do armamento deve autenticar-se para validar a guarda e assinar digitalmente o depósito.</p>
                </div>
              </div>

              <form onSubmit={handleTotemAuth} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Matrícula (RG Funcional) *:</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: PM-921384"
                    value={totemMatricula}
                    onChange={(e) => setTotemMatricula(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg p-2.5 text-xs text-slate-200 uppercase focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Senha de Assinatura (4 números) *:</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={totemSenha}
                    onChange={(e) => setTotemSenha(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-center tracking-widest text-lg"
                  />
                </div>

                {totemError && (
                  <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-550" />
                    <span>{totemError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTotemModalOpen(false);
                      setTotemMatricula('');
                      setTotemSenha('');
                      setTotemError('');
                    }}
                    className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-transparent text-slate-400 hover:text-slate-205 rounded-lg transition-colors font-bold uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-550 text-white rounded-lg transition-colors font-bold uppercase cursor-pointer shadow-md glow-blue"
                  >
                    Autenticar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE DEVOLUÇÃO / RESTITUIÇÃO PARTICULAR */}
      <AnimatePresence>
        {selectedPolicialMatriculaDevolucao && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs font-sans relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500" />
              
              <div className="flex items-start gap-3 border-b border-slate-850 pb-3">
                <div className="bg-emerald-955/40 p-2.5 rounded-lg border border-emerald-900/30 text-emerald-450">
                  <FolderLock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-widest">Restituição de Carga Particular</h3>
                  <p className="text-xs text-slate-450 leading-relaxed mt-0.5 font-medium">
                    Militar: <strong className="text-slate-200 uppercase font-sans">
                      {(() => {
                        const pol = usuarios.find(u => u.matricula === selectedPolicialMatriculaDevolucao);
                        return pol ? `${pol.posto_graduacao} ${pol.nome}` : selectedPolicialMatriculaDevolucao;
                      })()}
                    </strong>
                  </p>
                </div>
              </div>

              <form onSubmit={handleDevolucaoParticular} className="space-y-4">
                {/* Listagem de itens do Militar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide">Selecione os itens a serem restituídos:</label>
                    <button
                      type="button"
                      onClick={() => {
                        const itemsOfPol = armasParticulares
                          .filter(ap => ap.status === 'guardado' && ap.matricula_policial === selectedPolicialMatriculaDevolucao)
                          .map(ap => ap.id_particular);
                        
                        if (selectedItensDevolucao.length === itemsOfPol.length) {
                          setSelectedItensDevolucao([]); // Desmarcar todos
                        } else {
                          setSelectedItensDevolucao(itemsOfPol); // Marcar todos
                        }
                      }}
                      className="text-[9px] font-mono text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider bg-transparent border-none cursor-pointer"
                    >
                      {(() => {
                        const itemsOfPol = armasParticulares.filter(ap => ap.status === 'guardado' && ap.matricula_policial === selectedPolicialMatriculaDevolucao);
                        return selectedItensDevolucao.length === itemsOfPol.length ? 'Desmarcar Todos' : 'Marcar Todos';
                      })()}
                    </button>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 max-h-40 overflow-y-auto space-y-2">
                    {armasParticulares
                      .filter(ap => ap.status === 'guardado' && ap.matricula_policial === selectedPolicialMatriculaDevolucao)
                      .map((item) => {
                        const isChecked = selectedItensDevolucao.includes(item.id_particular);
                        return (
                          <div 
                            key={item.id_particular}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedItensDevolucao(prev => prev.filter(id => id !== item.id_particular));
                              } else {
                                setSelectedItensDevolucao(prev => [...prev, item.id_particular]);
                              }
                            }}
                            className={`p-2.5 rounded border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 text-xs ${
                              isChecked 
                                ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' 
                                : 'bg-slate-900/40 border-slate-850 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // Handle pelo container click
                                className="rounded text-emerald-600 bg-slate-950 border-slate-800 focus:ring-emerald-505 shrink-0 cursor-pointer"
                              />
                              <div className="text-[11px] font-mono uppercase">
                                <strong>{item.modelo}</strong>
                                <span className="text-[9px] text-slate-500 ml-1.5 font-bold">
                                  {item.numero_serie ? `[S/N: ${item.numero_serie}]` : item.quantidade && `[Qtd: ${item.quantidade}]`}
                                </span>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 uppercase shrink-0">
                              {item.tipo_item}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Confirmação por Senha */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Assinatura Digital do Militar (Senha de 4 dígitos) *:</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={devolucaoSenhaInput}
                    onChange={(e) => setDevolucaoSenhaInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-2.5 text-xs text-slate-202 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 text-center tracking-widest text-lg"
                  />
                </div>

                {devolucaoError && (
                  <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-550" />
                    <span>{devolucaoError}</span>
                  </div>
                )}

                {devolucaoSuccess && (
                  <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-lg text-xs text-emerald-450 font-mono flex items-start gap-2 animate-fadeIn">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-455" />
                    <span>{devolucaoSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPolicialMatriculaDevolucao(null);
                      setSelectedItensDevolucao([]);
                      setDevolucaoSenhaInput('');
                      setDevolucaoError('');
                      setDevolucaoSuccess('');
                    }}
                    className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-transparent text-slate-400 hover:text-slate-205 rounded-lg transition-colors font-bold uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={selectedItensDevolucao.length === 0}
                    className={`px-4 py-2 rounded-lg transition-colors font-bold uppercase cursor-pointer shadow-md ${
                      selectedItensDevolucao.length === 0
                        ? 'bg-slate-950 border border-slate-850 text-slate-600 cursor-not-allowed opacity-40'
                        : 'bg-emerald-655 hover:bg-emerald-500 text-white glow-emerald'
                    }`}
                  >
                    Confirmar Restituição
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTEÚDO: FILA DE SINCRONIZAÇÃO */}
      {bancoDadosSubSection === 'sincronizacao' && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-6 animate-fadeIn">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800/50 pb-4">
            <div>
              <h4 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className={`h-4.5 w-4.5 text-blue-500 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Painel de Contingência & Sincronização</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                Gerencie e libere transações offline retidas no SQLite local devido a instabilidades de rede ou conflitos de políticas.
              </p>
            </div>

            <div className="flex gap-2.5 font-mono">
              <button
                onClick={async () => {
                  if (forcarSincronizacao) {
                    await forcarSincronizacao();
                  }
                }}
                disabled={!isOnline || isSyncing || filaSincronizacao.length === 0}
                className={`px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer flex items-center gap-2 border ${
                  !isOnline || isSyncing || filaSincronizacao.length === 0
                    ? 'bg-slate-950 border-slate-850 text-slate-600 cursor-not-allowed opacity-40'
                    : 'bg-blue-600/10 text-blue-400 border-blue-500/30 hover:bg-blue-600/20 glow-blue'
                }`}
              >
                <Play className="h-3.5 w-3.5" />
                <span>Sincronizar Fila</span>
              </button>
              <button
                onClick={async () => {
                  if (window.confirm('ATENÇÃO: Isso apagará permanentemente TODAS as transações offline pendentes no dispositivo local. Os dados não serão salvos no Supabase. Deseja prosseguir?')) {
                    if (limparFilaSincronizacao) {
                      await limparFilaSincronizacao();
                    }
                  }
                }}
                disabled={filaSincronizacao.length === 0}
                className={`px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer flex items-center gap-2 border ${
                  filaSincronizacao.length === 0
                    ? 'bg-slate-950 border-slate-850 text-slate-600 cursor-not-allowed opacity-40'
                    : 'bg-rose-600/10 text-rose-400 border-rose-500/30 hover:bg-rose-600/20'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Limpar Fila</span>
              </button>
            </div>
          </div>

          {/* Grid de Informações Rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono">Status da Conexão</span>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className="text-xs font-mono font-bold uppercase text-slate-200">
                  {isOnline ? 'Conectado (Online)' : 'Instável / Offline'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono">Transações na Fila</span>
              <span className="text-xl font-bold font-mono text-slate-100 mt-2">
                {filaSincronizacao.length} <span className="text-xs font-normal text-slate-500">itens</span>
              </span>
            </div>

            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono">Processamento</span>
              <span className="text-xs font-mono font-bold uppercase text-slate-200 mt-2">
                {isSyncing ? (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Sincronizando...
                  </span>
                ) : (
                  <span className="text-slate-400">Aguardando gatilho</span>
                )}
              </span>
            </div>
          </div>

          {filaSincronizacao.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl space-y-2">
              <CheckCircle className="h-8 w-8 text-emerald-500/60 mx-auto" />
              <h5 className="text-xs font-bold font-mono text-slate-300 uppercase">Fila de Sincronização Limpa</h5>
              <p className="text-[10px] text-slate-500 max-w-sm mx-auto font-sans">
                Não há transações offline retidas no SQLite local. Todo o estoque e militares estão sincronizados com a nuvem.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 font-mono">
                <span>Operações em Fila (Ordem Cronológica)</span>
                <span>Ações</span>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {filaSincronizacao.map((item) => {
                  const errorMsg = syncQueueErrors[item.id];
                  const isExpanded = expandedPayloadId === item.id;
                  return (
                    <div 
                      key={item.id} 
                      className={`bg-slate-950/50 border rounded-xl transition-all duration-200 ${
                        errorMsg ? 'border-red-900/40 hover:border-red-900/60' : 'border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1.5 flex-1 w-full min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[8px] font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 font-bold text-slate-400">
                              #{item.id}
                            </span>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                              item.operacao.includes('DEVOLUCAO') 
                                ? 'bg-amber-400/10 text-amber-400 border border-amber-500/20' 
                                : item.operacao.includes('CAUTELA')
                                ? 'bg-blue-400/10 text-blue-400 border border-blue-500/20'
                                : 'bg-emerald-400/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {formatOperacao(item.operacao)}
                            </span>
                            {errorMsg && (
                              <span className="text-[8px] font-mono bg-rose-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> BLOQUEADO / ERRO
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-slate-500">
                              {new Date(item.timestamp).toLocaleString('pt-BR')}
                            </span>
                          </div>

                          <p className="text-xs font-mono font-bold text-slate-300 truncate">
                            {getPayloadSummary(item)}
                          </p>

                          {errorMsg && (
                            <div className="text-[10px] font-mono text-rose-450 bg-red-955/20 border border-red-900/30 p-2 rounded-lg mt-1 flex items-start gap-1.5">
                              <ShieldAlert className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span className="break-all"><strong>Erro de SGBD:</strong> {errorMsg}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 font-mono shrink-0 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => setExpandedPayloadId(isExpanded ? null : item.id)}
                            className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Ver Payload JSON"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Deseja realmente ignorar/descartar esta transação? Ela será removida da fila e NUNCA será sincronizada com o Supabase.')) {
                                if (removerItemFilaSincronizacao) {
                                  await removerItemFilaSincronizacao(item.id);
                                }
                              }
                            }}
                            className="p-2 border border-rose-900/30 hover:border-rose-900/50 bg-rose-955/10 text-rose-400 hover:text-rose-350 rounded-lg transition-colors cursor-pointer"
                            title="Descartar Item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-850/50 pt-3 bg-slate-950/40">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono block mb-1.5 font-bold">JSON do Payload</span>
                          <pre className="text-[10px] font-mono text-blue-400 bg-slate-950 border border-slate-900 p-3 rounded-lg overflow-x-auto max-h-[150px]">
                            {JSON.stringify(JSON.parse(item.payload), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
