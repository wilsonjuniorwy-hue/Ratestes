import React, { useState } from 'react';
import { 
  Database, Search, KeyRound, Package, ShieldAlert, CheckCircle, AlertTriangle, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Usuario, Material, SituacaoMilitar, StatusMaterial, Categoria, Cautela, CautelaItem } from '../types';

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
  excluirPolicialTotal?: (matricula: string) => Promise<{ success: boolean }>;
  excluirMaterialTotal?: (idMaterial: string) => Promise<{ success: boolean }>;
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
  excluirPolicialTotal,
  excluirMaterialTotal
}: BancoDadosViewProps) {
  // --- ESTADOS DA ABA BANCO DE DADOS ---
  const [bancoDadosSubSection, setBancoDadosSubSection] = useState<'policiais' | 'estoque'>('policiais');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [stockSearchTerm, setStockSearchTerm] = useState('');

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
      fabNorm = newMaterialFabricante.trim();
      specNorm = newMaterialSpecs.trim();
      isQty = newMaterialQuantidade > 1;

      if (!idNorm || !modNorm || !fabNorm || !newMaterialCategoria) {
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
                  .map((user) => (
                    <tr key={user.matricula} className="hover:bg-slate-900/25 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-400">{user.matricula}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200">{user.nome_de_guerra || 'N/A'}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">{user.nome}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-400">{user.posto_graduacao}</td>
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleZerarSenhaClick(user.matricula)}
                            className="px-3 py-1.5 bg-slate-955 hover:bg-amber-955/20 border border-slate-800 hover:border-amber-900/50 text-[10px] font-mono text-slate-400 hover:text-amber-400 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer uppercase font-bold"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            <span>Zerar Senha</span>
                          </button>
                          
                          {activeArmeiroMatricula === '7317573' && (
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
                  ))}
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
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Modelo *:</label>
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
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Fabricante *:</label>
                      <input
                        type="text"
                        required
                        placeholder="EX: Taurus"
                        value={newMaterialFabricante}
                        onChange={(e) => setNewMaterialFabricante(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>

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
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Modelo *:</label>
                      <input
                        type="text"
                        required
                        placeholder="EX: Colete Kevlar Nivel III"
                        value={newMaterialModelo}
                        onChange={(e) => setNewMaterialModelo(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Fabricante *:</label>
                      <input
                        type="text"
                        required
                        placeholder="EX: Inbra Terrestre"
                        value={newMaterialFabricante}
                        onChange={(e) => setNewMaterialFabricante(e.target.value)}
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
                    placeholder="Filtrar estoque por modelo, fabricante ou serial..."
                    value={stockSearchTerm}
                    onChange={(e) => setStockSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-9 pr-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                  <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-555" />
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
                      <th className="p-4">Modelo / Fabricante</th>
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
                                <span className="text-[10px] text-slate-550 font-mono mt-0.5">{mat.fabricante} {mat.calibre !== 'N/A' && mat.calibre ? `[Calibre: ${mat.calibre}]` : ''}</span>
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

                                 {activeArmeiroMatricula === '7317573' && (
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
    </div>
  );
}
