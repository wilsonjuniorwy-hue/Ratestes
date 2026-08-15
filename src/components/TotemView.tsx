import React from 'react';
import { 
  User, Shield, ArrowRight, ShieldAlert, KeyRound, 
  Layers, Package, ChevronRight, CheckCircle, Power, FileCheck2, AlertTriangle, AlertOctagon,
  Search, X, Siren
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Usuario, Material, Cautela, CautelaItem, AuditoriaLog, SituacaoMilitar } from '../types';
import { supabase } from '../supabaseClient';
import { comparePassword, hashSHA256 } from '../utils/crypto';
import { useOfflineDatabase } from '../hooks/useOfflineDatabase';
import { formatPostoGraduacaoSigla, POSTOS_GRADUACOES_EXTENSO } from '../utils/rankUtils';

interface TotemViewProps {
  usuarios: Usuario[];
  materiais: Material[];
  cautelas: Cautela[];
  cautelaItens: CautelaItem[];
  policialStep: 'login' | 'cadastro_senha' | 'aptidao' | 'carrinho' | 'assinatura' | 'sucesso';
  setPolicialStep: React.Dispatch<React.SetStateAction<'login' | 'cadastro_senha' | 'aptidao' | 'carrinho' | 'assinatura' | 'sucesso'>>;
  matriculaInput: string;
  setMatriculaInput: (v: string) => void;
  senhaInput: string;
  setSenhaInput: (v: string) => void;
  loggedUser: Usuario | null;
  setLoggedUser: (u: Usuario | null) => void;
  novaSenhaInput: string;
  setNovaSenhaInput: (v: string) => void;
  confirmarSenhaInput: string;
  setConfirmarSenhaInput: (v: string) => void;
  cadastroSenhaError: string;
  setCadastroSenhaError: (v: string) => void;
  cartItens: string[];
  setCartItens: React.Dispatch<React.SetStateAction<string[]>>;
  observacoesRetirada: string;
  setObservacoesRetirada: (v: string) => void;
  generatedCautela: Cautela | null;
  setGeneratedCautela: (c: Cautela | null) => void;
  authError: string;
  setAuthError: (v: string) => void;
  
  // SGBD actions
  registrarLogAuditoria: (executor: string, tipo: AuditoriaLog['tipo_evento'], detalhes: string) => void;
  cadastrarSenha: (matricula: string, novaSenhaInput: string) => void;
  processEfetivarCautela: (
    matriculaPolicial: string, 
    cartItens: string[], 
    observacoes: string,
    weaponMagazines?: Record<string, number>,
    isPermanent?: boolean,
    radioBatteries?: Record<string, { brand: 'Hytera' | 'Sepura'; qty: number }>,
    isEmergencial?: boolean,
    motivoEmergencial?: string
  ) => Promise<Cautela | null> | Cautela | null;
  cadastrarPolicial: (novoPolicial: Usuario) => Promise<{ success: boolean; error?: string }>;

  isPermanentMode?: boolean;
  onResetPermanentMode?: () => void;
  isEmergencyMode?: boolean;
  onResetEmergencyMode?: () => void;
}

export function TotemView({
  usuarios,
  materiais,
  cautelas,
  cautelaItens,
  policialStep,
  setPolicialStep,
  matriculaInput,
  setMatriculaInput,
  senhaInput,
  setSenhaInput,
  loggedUser,
  setLoggedUser,
  novaSenhaInput,
  setNovaSenhaInput,
  confirmarSenhaInput,
  setConfirmarSenhaInput,
  cadastroSenhaError,
  setCadastroSenhaError,
  cartItens,
  setCartItens,
  observacoesRetirada,
  setObservacoesRetirada,
  generatedCautela,
  setGeneratedCautela,
  authError,
  setAuthError,
  registrarLogAuditoria,
  cadastrarSenha,
  processEfetivarCautela,
  cadastrarPolicial,
  isPermanentMode = false,
  onResetPermanentMode,
  isEmergencyMode = false,
  onResetEmergencyMode
}: TotemViewProps) {
  const offlineDb = useOfflineDatabase();
  const [confirmarCautelaPin, setConfirmarCautelaPin] = React.useState('');
  const [pinError, setPinError] = React.useState('');
  const [motivoEmergencialInput, setMotivoEmergencialInput] = React.useState('');
  const [isSubmittingCautela, setIsSubmittingCautela] = React.useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [forcePermitirMaisItens, setForcePermitirMaisItens] = React.useState(false);

  // Estados locais para Cadastro de Novo Policial pelo Totem
  const [isCadastroModalOpen, setIsCadastroModalOpen] = React.useState(false);
  const [newNome, setNewNome] = React.useState('');
  const [newNomeDeGuerra, setNewNomeDeGuerra] = React.useState('');
  const [newPosto, setNewPosto] = React.useState('Soldado');
  const [newSituacao, setNewSituacao] = React.useState<SituacaoMilitar>('apto');
  const [cadastroError, setCadastroError] = React.useState('');

  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = React.useState(false);
  const [selectedAccessoryWeapon, setSelectedAccessoryWeapon] = React.useState<Material | null>(null);
  const [selectedAccessoryAmmoQty, setSelectedAccessoryAmmoQty] = React.useState(0);
  const [selectedAccessoryMagQty, setSelectedAccessoryMagQty] = React.useState(0);
  const [selectedAccessoryBatteryQty, setSelectedAccessoryBatteryQty] = React.useState(1);
  const [cartWeaponMagazines, setCartWeaponMagazines] = React.useState<Record<string, number>>({});
  const [cartRadioBatteries, setCartRadioBatteries] = React.useState<Record<string, { brand: 'Hytera' | 'Sepura'; qty: number }>>({});

  const getRadioInfo = (mat: Material | null): { isRadio: boolean; brand: 'Hytera' | 'Sepura' | null } => {
    if (!mat) return { isRadio: false, brand: null };
    const modelUpper = (mat.modelo || '').toUpperCase();
    const idUpper = (mat.id_material || '').toUpperCase();
    const fabUpper = (mat.fabricante || '').toUpperCase();
    const catId = (mat.id_categoria || '').toUpperCase();

    const isRadioMatch =
      catId === 'CAT-COMUNICACAO' ||
      fabUpper === 'HYTERA' ||
      fabUpper === 'SEPURA' ||
      modelUpper.includes('RÁDIO') ||
      modelUpper.includes('RADIO') ||
      modelUpper.startsWith('HT') ||
      idUpper.startsWith('HT') ||
      modelUpper.startsWith('HY') ||
      idUpper.startsWith('HY') ||
      modelUpper.startsWith('SEP') ||
      idUpper.startsWith('SEP');

    if (!isRadioMatch) {
      return { isRadio: false, brand: null };
    }

    if (fabUpper === 'HYTERA' || modelUpper.startsWith('HY') || idUpper.startsWith('HY') || idUpper.includes('.213.') || modelUpper.includes('HY213')) {
      return { isRadio: true, brand: 'Hytera' };
    }
    if (fabUpper === 'SEPURA' || modelUpper.startsWith('SEP') || idUpper.startsWith('SEP') || idUpper.includes('.216.') || modelUpper.includes('SEP216')) {
      return { isRadio: true, brand: 'Sepura' };
    }

    if (modelUpper.includes('HY')) return { isRadio: true, brand: 'Hytera' };
    if (modelUpper.includes('SEP')) return { isRadio: true, brand: 'Sepura' };

    return { isRadio: true, brand: 'Hytera' };
  };

  const isFirearmRequiringAccessories = (mat: Material) => {
    if (!mat.calibre || mat.calibre === 'N/A') return false;
    const cal = mat.calibre.toLowerCase();
    return cal.includes('9mm') || cal.includes('5.56') || cal.includes('9x19mm') || cal.includes('5.56x45');
  };

  const isItemExpired = (dataValidade: string | undefined): boolean => {
    if (!dataValidade) return false;
    const parts = dataValidade.split('-');
    if (parts.length !== 3) return false;
    
    const validadeDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const today = new Date();
    today.setHours(0,0,0,0);
    validadeDate.setHours(0,0,0,0);

    return validadeDate.getTime() < today.getTime();
  };

  const normalizeCaliber = (cal: string | undefined): string => {
    if (!cal || cal === 'N/A') return '';
    const clean = cal.toLowerCase().replace(/\s+/g, '');
    if (clean === '9' || clean.includes('9mm') || clean.includes('9x19') || clean.includes('9para')) return '9mm';
    if (clean.includes('556') || clean.includes('5.56')) return '5.56mm';
    if (clean.includes('.40') || clean.includes('40s&w') || clean.includes('40sw') || clean === '40') return '.40';
    if (clean.includes('.380') || clean.includes('380')) return '.380';
    if (clean.includes('762') || clean.includes('7.62') || clean === '7.62') return '7.62mm';
    if (clean.includes('.38') || clean.includes('38spl') || clean.includes('38special') || clean === '38') return '.38';
    return clean;
  };

  const getCompatibleAccessories = (weapon: Material | undefined, allMaterials: Material[]) => {
    if (!weapon) return null;
    const normCal = normalizeCaliber(weapon.calibre);

    const isAccessory = (m: Material) => {
      const catId = m.id_categoria.toLowerCase();
      const isWeapon = catId.includes('arma');
      const isRadio = catId.includes('comunic') || catId.includes('radio');
      const isColete = catId.includes('colete') || catId.includes('manutencao');
      return !isWeapon && !isRadio && !isColete;
    };

    // Procurar Munição pelo calibre correspondente
    const ammo = allMaterials.find(m => {
      if (!isAccessory(m)) return false;
      const mCal = normalizeCaliber(m.calibre);
      const modelLower = m.modelo.toLowerCase();
      const isMagType = modelLower.includes('carregador') || modelLower.includes('pente') || modelLower.includes('mag');
      return !isMagType && mCal === normCal;
    });

    return {
      ammoId: ammo?.id_material || '',
      ammoLabel: ammo?.modelo || 'Munição Compatível (Sem Estoque)',
      ammoMat: ammo || null
    };
  };

  const handleConfirmarAcessorios = () => {
    if (!selectedAccessoryWeapon) return;
    
    setCartItens(prev => [...prev, selectedAccessoryWeapon.id_material]);

    setCartWeaponMagazines(prev => ({
      ...prev,
      [selectedAccessoryWeapon.id_material]: selectedAccessoryMagQty
    }));
    
    setIsAccessoryModalOpen(false);
    setSelectedAccessoryWeapon(null);
  };

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

  const ajustarQuantidadeCarrinho = (idMat: string, newQty: number, maxQty: number) => {
    const qtyNormalizada = Math.max(0, Math.min(newQty, maxQty));
    setCartItens(prev => {
      const outrosItens = prev.filter(id => id !== idMat);
      const novosItens = Array(qtyNormalizada).fill(idMat);
      return [...outrosItens, ...novosItens];
    });
  };

  // Abre automaticamente o modal de busca ao entrar na etapa de seleção de carga
  React.useEffect(() => {
    if (policialStep === 'carrinho') {
      setIsSearchModalOpen(true);
      setSearchQuery('');
      setConfirmarCautelaPin('');
      setPinError('');
    } else {
      setIsSearchModalOpen(false);
    }
  }, [policialStep]);

  // ---- PROCESSAMENTO DE LOGIN POLICIAL ----
  const handlePolicialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const matriculaNorm = matriculaInput.trim().toUpperCase();
    const isOnline = window.navigator.onLine;

    try {
      let user: any = null;

      if (!isOnline) {
        console.log('SGBD Offline: Buscando militar localmente...');
        const usersLocal = await offlineDb.obterUsuariosLocal();
        const found = usersLocal.find(u => u.matricula === matriculaNorm);
        if (!found) {
          setAuthError('Matrícula não encontrada localmente no SGBD.');
          return;
        }
        user = found;
      } else {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('matricula', matriculaNorm)
          .is('deletado_em', null)
          .single();

        if (error || !data) {
          setAuthError('Matrícula não cadastrada no SGBD militar.');
          return;
        }
        user = data;
      }

      // Verificar se o usuário está bloqueado temporariamente por excesso de tentativas
      if (user.bloqueado_ate) {
        const bloqueadoAteDate = new Date(user.bloqueado_ate);
        if (bloqueadoAteDate > new Date()) {
          const diffMs = bloqueadoAteDate.getTime() - Date.now();
          const min = Math.ceil(diffMs / 60000);
          setAuthError(`Acesso bloqueado por excesso de tentativas. Tente novamente em ${min} minuto(s).`);
          return;
        }
      }

      // Sucesso no login (acesso direto, sem validação de senha neste momento)
      setLoggedUser(user);
      setPolicialStep('aptidao');
      registrarLogAuditoria(user.matricula, 'login', `Militar logado via matrícula no autoatendimento. Status atual: ${user.situacao_cautela.toUpperCase()}.`);
    } catch (err) {
      console.error('Erro de login no Totem:', err);
      setAuthError('Falha de conexão com o SGBD militar.');
    }
  };

  // ---- CADASTRO DE NOVO POLICIAL PELO TOTEM (MATRÍCULA NÃO CADASTRADA) ----
  const handleCadastrarNovoUsuarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCadastroError('');

    const matriculaNorm = matriculaInput.trim().toUpperCase();
    if (!matriculaNorm) {
      setCadastroError('Matrícula de pesquisa ausente.');
      return;
    }

    if (!newNome.trim()) {
      setCadastroError('O Nome Completo é obrigatório.');
      return;
    }

    if (!newNomeDeGuerra.trim()) {
      setCadastroError('O Nome de Guerra é obrigatório.');
      return;
    }

    const novoPolicial: Usuario = {
      matricula: matriculaNorm,
      nome: newNome.trim(),
      nome_de_guerra: newNomeDeGuerra.trim(),
      senha_hash: '', // Senha vazia para que ele crie o PIN de 4 dígitos na assinatura
      perfil: 'policial',
      posto_graduacao: newPosto,
      situacao_cautela: newSituacao,
      data_ultimo_teste_psicologico: new Date().toISOString().split('T')[0], // Padrão hoje (não verificado no Totem)
    };

    try {
      const result = await cadastrarPolicial(novoPolicial);
      if (result && !result.success) {
        setCadastroError(result.error || 'Erro ao realizar o cadastro do militar.');
      } else {
        // Sucesso no cadastro: Limpa os campos do modal, fecha o modal e faz login automático do policial
        setNewNome('');
        setNewNomeDeGuerra('');
        setNewPosto('Soldado');
        setNewSituacao('apto');
        setIsCadastroModalOpen(false);
        setAuthError(''); // Limpa o erro de login anterior
        
        // Login automático
        setLoggedUser(novoPolicial);
        setPolicialStep('aptidao');
        registrarLogAuditoria(
          novoPolicial.matricula, 
          'login', 
          `Militar auto-cadastrado e logado via Totem. Status atual: ${novoPolicial.situacao_cautela.toUpperCase()}.`
        );
      }
    } catch (err: any) {
      setCadastroError(err.message || 'Falha de conexão ao cadastrar militar.');
    }
  };

  // ---- CADASTRO DE SENHA DO PRIMEIRO ACESSO ----
  const handleCadastrarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setCadastroSenhaError('');

    if (!loggedUser) return;

    if (!/^\d{4,6}$/.test(novaSenhaInput)) {
      setCadastroSenhaError('A senha deve conter de 4 a 6 números (ex: 1234 ou 123456).');
      return;
    }

    if (novaSenhaInput !== confirmarSenhaInput) {
      setCadastroSenhaError('As senhas digitadas não coincidem.');
      return;
    }

    cadastrarSenha(loggedUser.matricula, novaSenhaInput);

    const hashed = await hashSHA256(novaSenhaInput);
    const updatedUser = { ...loggedUser, senha_hash: hashed };
    setLoggedUser(updatedUser);
    
    if (cartItens.length > 0) {
      setPolicialStep('assinatura');
    } else {
      setPolicialStep('aptidao');
    }
  };

  // ---- VERIFICAÇÃO DE APTIDÃO ----
  const checkMilitarAptidacao = () => {
    if (!loggedUser) return { apto: false, motivos: ['Militar não identificado.'], restrito: false };

    const motivos: string[] = [];
    const restrito = loggedUser.situacao_cautela === 'restrito_servico';

    if (loggedUser.situacao_cautela === 'suspenso') {
      motivos.push(`[Suspensão Ativa] Militar suspenso administrativo. Motivo: ${loggedUser.motivo_suspensao || 'Impedimento preventivo em corregedoria.'}`);
    }

    if (loggedUser.situacao_cautela === 'pendente_devolucao' && !forcePermitirMaisItens) {
      motivos.push(`[Pendências de Reserva] O militar possui atraso de material bélico ultrapassado. Retirada bloqueada.`);
    }

    return {
      apto: motivos.length === 0,
      motivos,
      restrito
    };
  };

  const aptidaoMilitar = checkMilitarAptidacao();

  // ---- MANIPULAÇÃO DO CARRINHO DE CAUTELA ----
  const toggleCartItem = (idMat: string) => {
    const mat = materiais.find(m => m.id_material === idMat);
    if (!mat) return;

    if (cartItens.includes(idMat)) {
      setCartItens(prev => prev.filter(id => id !== idMat));
      // Remover dos carregadores
      setCartWeaponMagazines(prev => {
        const copy = { ...prev };
        delete copy[idMat];
        return copy;
      });
      // Remover das baterias
      setCartRadioBatteries(prev => {
        const copy = { ...prev };
        delete copy[idMat];
        return copy;
      });
    } else {
      const radioInfo = getRadioInfo(mat);
      if (isFirearmRequiringAccessories(mat) || radioInfo.isRadio) {
        setSelectedAccessoryWeapon(mat);
        setSelectedAccessoryAmmoQty(0);
        setSelectedAccessoryMagQty(0);
        setSelectedAccessoryBatteryQty(1); // Padrão de 1 bateria para rádios
        setIsAccessoryModalOpen(true);
      } else {
        setCartItens(prev => [...prev, idMat]);
      }
    }
  };

  // ---- EFETIVAR CAUTELA ----
  const handleEfetivarCautela = async () => {
    if (isSubmittingCautela) return;
    if (!loggedUser || cartItens.length === 0) return;

    // Se for cautela emergencial, ignora verificação de PIN da senha do policial
    if (isEmergencyMode) {
      setPinError('');
      let finalObs = observacoesRetirada || '';
      const batteryNotes: string[] = [];
      Object.entries(cartRadioBatteries).forEach(([idMat, bInfo]) => {
        if (cartItens.includes(idMat) && bInfo.qty >= 0) {
          const m = materiais.find(mat => mat.id_material === idMat);
          const mName = m ? m.modelo : idMat;
          batteryNotes.push(`${mName}: ${bInfo.qty}x Bateria ${bInfo.brand}`);
        }
      });
      if (batteryNotes.length > 0) {
        finalObs = finalObs ? `${finalObs} | [Baterias HT: ${batteryNotes.join(', ')}]` : `[Baterias HT: ${batteryNotes.join(', ')}]`;
      }

      setIsSubmittingCautela(true);
      try {
        const newCautela = await processEfetivarCautela(
          loggedUser.matricula, 
          cartItens, 
          finalObs, 
          cartWeaponMagazines, 
          isPermanentMode, 
          cartRadioBatteries,
          true,
          motivoEmergencialInput
        );
        if (newCautela) {
          setGeneratedCautela(newCautela);
          setConfirmarCautelaPin('');
          setIsSearchModalOpen(false);
          setSearchQuery('');
          setPolicialStep('sucesso');
        }
      } catch (err) {
        console.error('Erro ao efetivar cautela emergencial:', err);
      } finally {
        setIsSubmittingCautela(false);
      }
      return;
    }

    if (!confirmarCautelaPin) {
      setPinError('Digite sua senha para assinar e confirmar os itens.');
      return;
    }

    try {
      setIsSubmittingCautela(true);
      const { matches } = await comparePassword(confirmarCautelaPin, loggedUser.senha_hash);
      if (!matches) {
        setPinError('Inconsistência cadastral. Senha de assinatura digital incorreta.');
        setIsSubmittingCautela(false);
        return;
      }

      setPinError('');
      
      // Monta observações de baterias dos rádios acautelados
      let finalObs = observacoesRetirada || '';
      const batteryNotes: string[] = [];
      Object.entries(cartRadioBatteries).forEach(([idMat, bInfo]) => {
        if (cartItens.includes(idMat) && bInfo.qty >= 0) {
          const m = materiais.find(mat => mat.id_material === idMat);
          const mName = m ? m.modelo : idMat;
          batteryNotes.push(`${mName}: ${bInfo.qty}x Bateria ${bInfo.brand}`);
        }
      });
      if (batteryNotes.length > 0) {
        finalObs = finalObs ? `${finalObs} | [Baterias HT: ${batteryNotes.join(', ')}]` : `[Baterias HT: ${batteryNotes.join(', ')}]`;
      }

      const newCautela = await processEfetivarCautela(
        loggedUser.matricula, 
        cartItens, 
        finalObs, 
        cartWeaponMagazines, 
        isPermanentMode, 
        cartRadioBatteries,
        false,
        ''
      );
      if (newCautela) {
        setGeneratedCautela(newCautela);
        setConfirmarCautelaPin('');
        setIsSearchModalOpen(false);
        setSearchQuery('');
        setPolicialStep('sucesso');
      }
    } catch (err) {
      console.error('Erro ao efetivar cautela:', err);
    } finally {
      setIsSubmittingCautela(false);
    }
  };

  // ---- LOGOUT POLICIAL ----
  const handleLogoutPolicial = () => {
    setLoggedUser(null);
    setMatriculaInput('');
    setSenhaInput('');
    setCartItens([]);
    setCartWeaponMagazines({});
    setCartRadioBatteries({});
    setConfirmarCautelaPin('');
    setPinError('');
    setIsSearchModalOpen(false);
    setSearchQuery('');
    setForcePermitirMaisItens(false);
    // Limpar estados de autenticação e cadastro para não contaminar próxima sessão
    setAuthError('');
    setNovaSenhaInput('');
    setConfirmarSenhaInput('');
    setCadastroSenhaError('');
    setObservacoesRetirada('');
    setMotivoEmergencialInput('');
    setGeneratedCautela(null);
    setPolicialStep('login');
    if (isPermanentMode && onResetPermanentMode) {
      onResetPermanentMode();
    }
    if (isEmergencyMode && onResetEmergencyMode) {
      onResetEmergencyMode();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="policial-journey-wrapper">
      
      {/* Menu Lateral de Passos */}
      <div className="lg:col-span-3 space-y-4" id="policial-sidebar-steps">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 shadow-lg">
          <div className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Layers className="h-4 w-4 text-blue-500" />
            <span>Etapas do Checkout</span>
          </div>
          
          <div className="space-y-1.5">
            {[
              { id: 'login', num: '1', title: 'Identificação', desc: 'Apenas Matrícula' },
              { id: 'aptidao', num: '2', title: 'Aptidão Clínica', desc: 'Controle de barreiras' },
              { id: 'carrinho', num: '3', title: 'Dotação de Carga', desc: 'Seleção de materiais' },
              { id: 'assinatura', num: '4', title: 'Confirmação', desc: 'Termo e assinatura' },
              { id: 'sucesso', num: '5', title: 'Guia Gerada', desc: 'Comprovante tático' }
            ].map((step, idx) => {
              const activeSidebarId = (policialStep === 'cadastro_senha') ? 'login' : policialStep;
              const isActive = activeSidebarId === step.id;
              const isDone = [
                'login', 'aptidao', 'carrinho', 'assinatura', 'sucesso'
              ].indexOf(activeSidebarId) > idx;

              return (
                <div 
                  key={step.id}
                  className={`p-3.5 border rounded-lg text-left flex items-start gap-3 transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600/10 border-blue-500/40 text-white shadow-[0_0_10px_rgba(59,130,246,0.05)]'
                      : isDone
                      ? 'bg-slate-900/25 border-transparent text-slate-500'
                      : 'bg-slate-950/20 border-transparent text-slate-600'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]' 
                      : isDone 
                      ? 'bg-blue-900/40' 
                      : 'bg-slate-800'
                  }`} />
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold uppercase transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`}>{step.title}</span>
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {loggedUser && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 text-xs space-y-3 shadow-lg"
          >
            <div className="text-slate-400 font-mono font-bold flex items-center gap-2 uppercase tracking-wider border-b border-slate-800 pb-2">
              <User className="h-4 w-4 text-blue-400 glow-blue" />
              <span>Militar Logado</span>
            </div>
            <div className="text-[10px] space-y-2 font-mono">
              <p className="text-white uppercase font-black text-xs">{formatPostoGraduacaoSigla(loggedUser.posto_graduacao)} {loggedUser.nome_de_guerra || loggedUser.nome}</p>
              <p className="text-slate-400 uppercase">RG Funcional: <span className="text-blue-400 font-bold">{loggedUser.matricula}</span></p>
              <p className="text-slate-400 uppercase">Status: <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                loggedUser.situacao_cautela === 'apto' 
                  ? 'bg-emerald-950/40 text-emerald-450 border-emerald-900/30' 
                  : 'bg-red-950/40 text-red-400 border-red-900/30'
              }`}>{loggedUser.situacao_cautela.toUpperCase()}</span></p>
            </div>
            
            <button
              id="btn-logout-policial"
              onClick={handleLogoutPolicial}
              className="w-full mt-1.5 bg-slate-950/80 hover:bg-red-950/30 border border-slate-800 hover:border-red-900/50 text-[9px] font-mono text-slate-400 hover:text-red-400 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 uppercase font-bold cursor-pointer"
            >
              <Power className="h-3 w-3" />
              <span>Sair do Autoatendimento</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Área Principal de Execução */}
      <div className="lg:col-span-9" id="policial-main-step-view">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-lg relative min-h-[460px] flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/20 via-cyan-500/40 to-blue-500/20" />
          
          {isPermanentMode && (
            <div className="bg-blue-600/10 border-b border-blue-500/30 px-6 py-3 flex items-center gap-3 animate-pulse">
              <ShieldAlert className="h-5 w-5 text-blue-450 shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest block">MODO ACAUTELAMENTO PERMANENTE ATIVO</span>
                <span className="text-[9px] text-slate-300 font-sans block">Este acautelamento registrará a carga como permanente (definitiva) sob sua dotação pessoal.</span>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Passo 1: Login */}
            {policialStep === 'login' && (
              <motion.div 
                key="login-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-8 space-y-6 flex-1 flex flex-col justify-center max-w-md mx-auto w-full" 
                id="policial-login-step"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.1)] mb-2">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-350 font-mono uppercase tracking-widest block">Identificação Funcional</h3>
                  <p className="text-xs text-slate-400 font-sans">Forneça as credenciais militares para consulta de dotações vigentes no SGBD.</p>
                </div>

                <form onSubmit={handlePolicialLogin} className="space-y-4" id="form-login-policial">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide">Matrícula (Ex: PM-921384):</label>
                    <input
                      type="text"
                      id="input-matricula"
                      placeholder="EX: PM-921384"
                      value={matriculaInput}
                      required
                      onChange={(e) => setMatriculaInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 p-3 text-xs font-mono text-slate-200 focus:outline-none uppercase tracking-wider rounded-lg transition-all focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  {authError && (
                    <div className="bg-red-955/30 border border-red-900/40 p-3.5 rounded-lg text-xs text-red-400 font-mono leading-normal flex flex-col gap-2.5 glow-red">
                      <div className="flex items-start gap-2.5">
                        <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-red-500" />
                        <span>{authError}</span>
                      </div>
                      {(authError.toLowerCase().includes('cadastrada') || authError.toLowerCase().includes('encontrada')) && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewNome('');
                            setNewNomeDeGuerra('');
                            setNewPosto('Soldado');
                            setNewSituacao('apto');
                            setCadastroError('');
                            setIsCadastroModalOpen(true);
                          }}
                          className="mt-1 self-start px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/35 text-[10px] font-bold text-blue-400 hover:text-blue-300 rounded transition-all cursor-pointer flex items-center gap-1 uppercase"
                        >
                          <User className="h-3 w-3" />
                          <span>Cadastrar Novo Policial</span>
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    id="btn-submit-login"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-3.5 px-4 rounded-lg text-xs transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer glow-blue"
                  >
                    <span>Identificar Militar</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* Passo: Cadastro de Senha */}
            {policialStep === 'cadastro_senha' && loggedUser && (
              <motion.div 
                key="cadastro-senha-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-8 space-y-6 flex-1 flex flex-col justify-center max-w-md mx-auto w-full" 
                id="policial-cadastro-senha-step"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-cyan-600/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)] mb-2 animate-pulse">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-350 font-mono uppercase tracking-widest block text-cyan-400">Primeiro Acesso - Cadastrar Senha</h3>
                  <p className="text-xs text-slate-400 font-sans">
                    Militar **{formatPostoGraduacaoSigla(loggedUser.posto_graduacao)} {loggedUser.nome_de_guerra || loggedUser.nome}** identificado. Defina uma senha de 4 a 6 números para a sua assinatura eletrônica.
                  </p>
                </div>

                <form onSubmit={handleCadastrarSenha} className="space-y-4" id="form-cadastro-senha">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide">Nova Senha (4 a 6 dígitos numéricos):</label>
                    <input
                      type="password"
                      id="input-nova-senha"
                      maxLength={6}
                      placeholder="••••••"
                      value={novaSenhaInput}
                      required
                      onChange={(e) => setNovaSenhaInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 p-3 text-xs font-mono text-slate-200 focus:outline-none tracking-widest text-center rounded-lg transition-all focus:ring-1 focus:ring-cyan-500/20 text-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide">Confirmar Nova Senha:</label>
                    <input
                      type="password"
                      id="input-confirmar-senha"
                      maxLength={6}
                      placeholder="••••••"
                      value={confirmarSenhaInput}
                      required
                      onChange={(e) => setConfirmarSenhaInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 p-3 text-xs font-mono text-slate-200 focus:outline-none tracking-widest text-center rounded-lg transition-all focus:ring-1 focus:ring-cyan-500/20 text-lg"
                    />
                  </div>

                  {cadastroSenhaError && (
                    <div className="bg-red-955/30 border border-red-900/40 p-3.5 rounded-lg text-xs text-red-400 font-mono leading-normal flex items-start gap-2.5 glow-red">
                      <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-red-500" />
                      <span>{cadastroSenhaError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="btn-submit-cadastro-senha"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-3.5 px-4 rounded-lg text-xs transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer glow-blue"
                  >
                    <span>Cadastrar e Prosseguir</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPolicialStep('carrinho')}
                    className="w-full bg-transparent hover:bg-slate-955/50 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-800 font-mono py-2 rounded-lg text-xs transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Cancelar
                  </button>
                </form>
              </motion.div>
            )}

            {/* Passo 2: Verificação de Barreiras de Aptidão */}
            {policialStep === 'aptidao' && loggedUser && (
              <motion.div 
                key="aptidao-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 md:p-8 space-y-6 flex-1 flex flex-col h-full justify-between" 
                id="policial-aptitude-step"
              >
                <div className="space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
                    <div className="bg-blue-600/10 p-2.5 rounded-lg border border-blue-500/20 text-blue-400 glow-blue">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Barreiras de Aptidão de Armaria</h3>
                      <p className="text-xs text-slate-450 font-sans">Aferição em tempo real de travas regulamentares e avaliações psicológicas.</p>
                    </div>
                  </div>

                  {/* Ficha Diagnóstica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/45 p-4 border border-slate-850/80 space-y-2 rounded-lg">
                      <span className="text-[9px] text-slate-505 font-mono font-bold uppercase tracking-wider block">Inspeção Cadastral PMDF</span>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        <p className="text-slate-400">Nome: <strong className="text-slate-200 font-sans font-bold">{loggedUser.nome}</strong></p>
                        <p className="text-slate-400 font-sans">Graduação: <strong className="text-slate-200">{formatPostoGraduacaoSigla(loggedUser.posto_graduacao)}</strong></p>
                        <p className="text-slate-400">Matrícula: <strong className="text-blue-400 font-bold">{loggedUser.matricula}</strong></p>
                      </div>
                    </div>

                    <div className="bg-slate-950/45 p-4 border border-slate-850/80 space-y-2 rounded-lg">
                      <span className="text-[9px] text-slate-505 font-mono font-bold uppercase tracking-wider block">Inspeção Médica e de Reserva</span>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-sans">Psicotécnico:</span>
                          <span className="text-blue-450 font-bold">{loggedUser.data_ultimo_teste_psicologico}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-sans">Status Relacional:</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                            loggedUser.situacao_cautela === 'apto' 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' 
                              : loggedUser.situacao_cautela === 'restrito_servico'
                              ? 'bg-amber-950/40 text-amber-400 border-amber-900/30'
                              : 'bg-red-955/40 text-red-400 border-red-900/30'
                          }`}>
                            {loggedUser.situacao_cautela === 'restrito_servico' ? 'RESTRITO AO SERVIÇO' : loggedUser.situacao_cautela.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalhamento do Batimento de Regras */}
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Diagnóstico de Impedimentos:</span>
                    
                    {aptidaoMilitar.apto ? (
                      <div className="space-y-3">
                        <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-lg flex items-start gap-3 glow-emerald">
                          <CheckCircle className="h-5.5 w-5.5 text-emerald-400 shrink-0 mt-0.5 font-bold animate-pulse" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-emerald-300 font-mono block uppercase">CADASTRO HABILITADO PARA CAUTELA</h4>
                            <p className="text-xs text-slate-400 leading-relaxed font-sans">A validação cadastral não retornou restrições legais. O militar possui exame psicotécnico de porte dentro da validade legal e não consta em débito com a reserva bélica.</p>
                          </div>
                        </div>
                        
                        {aptidaoMilitar.restrito && (
                          <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-lg flex items-start gap-3 glow-amber">
                            <AlertTriangle className="h-5.5 w-5.5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-amber-300 font-mono block uppercase">PORTE COM RESTRIÇÃO DE SERVIÇO</h4>
                              <p className="text-xs text-slate-400 leading-relaxed font-sans">O militar possui restrição parcial de porte (Restrito ao Serviço). O acautelamento de armas de fogo e equipamentos bélicos é autorizado exclusivamente para o turno de serviço escalado.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-red-955/20 border border-red-900/40 p-4 rounded-lg flex items-start gap-3 glow-red">
                        <AlertOctagon className="h-5.5 w-5.5 text-red-500 shrink-0 mt-0.5" />
                        <div className="space-y-2 flex-1">
                          <h4 className="text-xs font-bold text-red-300 font-mono uppercase block">BLOQUEIO CRÍTICO DISPARADO</h4>
                          <p className="text-[11px] text-slate-400 leading-normal font-sans">O banco de dados relacional identificou restrições impeditivas. O checkout de novos materiais está administrativamente bloqueado.</p>
                          <ul className="space-y-1.5 text-[10px] text-red-350 font-mono">
                            {aptidaoMilitar.motivos.map((m, idx) => (
                              <li key={idx} className="bg-slate-955/80 p-2.5 border border-red-900/30 rounded-lg flex items-start gap-2">
                                <span className="text-red-500 select-none font-bold">▪</span>
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                          {loggedUser?.situacao_cautela === 'pendente_devolucao' && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setForcePermitirMaisItens(true);
                                  registrarLogAuditoria(
                                    loggedUser.matricula,
                                    'registro_cautela',
                                    `Militar acionou bypass no Totem para retirar mais materiais (cautela pendente/esquecimento).`
                                  );
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-2.5 px-4 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md glow-blue flex items-center justify-center gap-1.5"
                              >
                                <Package className="h-3.5 w-3.5" />
                                <span>Esqueci de acautelar itens / Retirar mais materiais</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-850 pt-4 mt-6 font-mono">
                  <button
                    id="btn-return-login"
                    onClick={handleLogoutPolicial}
                    className="text-xs text-slate-400 hover:text-slate-200 px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-lg transition-all cursor-pointer font-bold"
                  >
                    Voltar ao Login
                  </button>
                  {aptidaoMilitar.apto && (
                    <button
                      id="btn-go-to-select-materials"
                      onClick={() => setPolicialStep('carrinho')}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-all uppercase tracking-wider cursor-pointer shadow-md glow-blue"
                    >
                      <span>Escolher Equipamentos</span>
                      <ArrowRight className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Passo 3: Escolha do Material bélico */}
            {policialStep === 'carrinho' && loggedUser && (
              <motion.div 
                key="carrinho-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 md:p-8 space-y-5 flex-1 flex flex-col justify-between" 
                id="policial-cart-step"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Armário Tático de Dotação</h3>
                      <p className="text-xs text-slate-450 font-sans font-medium">Selecione os materiais cadastrados no paiol para compor sua carga de serviço.</p>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-850 px-3.5 py-2 rounded-lg text-[10px] text-blue-400 font-mono font-bold uppercase tracking-wider">
                      Itens Selecionados: <span className="text-white font-black">{cartItens.length}</span>
                    </div>
                  </div>

                  {/* Stock de Cautela */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1" id="stock-selection-wrapper">
                    {materiais.map((mat) => {
                      const countInCart = cartItens.filter(id => id === mat.id_material).length;
                      const isSelected = countInCart > 0;
                      const disponivelQty = getDisponivelQty(mat);
                      const isAvailable = mat.controle_quantidade ? (disponivelQty > 0 || isSelected) : (mat.status_atual === 'disponivel');
                      
                      return (
                        <div 
                          key={mat.id_material}
                          id={`stock-card-${mat.id_material}`}
                          className={`p-3.5 border rounded-lg flex items-center justify-between gap-3 transition-all duration-200 relative overflow-hidden ${
                            isSelected 
                              ? 'bg-blue-600/10 border-blue-500/40 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.08)]'
                              : isAvailable 
                              ? 'bg-slate-950/40 border-slate-850/80 text-slate-350 hover:border-slate-750 hover:bg-slate-950/70'
                              : 'bg-slate-950/10 border-slate-900/60 text-slate-600 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[8px] px-2 py-0.5 rounded font-black font-mono border ${
                                mat.id_categoria === 'CAT-ARMA-CURTA' || mat.id_categoria === 'CAT-ARMA-LONGA'
                                  ? 'bg-blue-950/70 text-blue-400 border-blue-900/40'
                                  : 'bg-slate-905 text-slate-455 border-slate-800'
                              }`}>
                                {mat.id_categoria.replace('CAT-', '')}
                              </span>
                              {mat.controle_quantidade && (
                                <span className="text-[9px] text-slate-505 font-mono font-bold">
                                  {`Item Coletivo (Disp: ${disponivelQty})`}
                                </span>
                              )}
                              {isItemExpired(mat.data_validade) && (
                                <span className="text-[8px] px-2 py-0.5 bg-red-950/70 text-red-400 border border-red-900/40 rounded font-black font-mono animate-pulse uppercase tracking-wider">
                                  Vencido
                                </span>
                              )}
                            </div>
                            <h4 className="text-base font-black uppercase text-slate-100 flex items-center gap-2">
                              <span>{mat.modelo}</span>
                              <span className="inline-flex items-center justify-center bg-slate-950 border border-slate-800 text-slate-200 px-2 py-0.5 rounded font-mono text-xs font-bold tracking-normal shrink-0">
                                {mat.id_material}
                              </span>
                            </h4>
                            <p className="text-[9px] text-slate-505 font-mono">
                              {mat.controle_quantidade 
                                ? (mat.fabricante && mat.fabricante !== 'N/A' ? `Fabricante: ${mat.fabricante}` : 'Item Coletivo/Lote') 
                                : (mat.calibre !== 'N/A' && mat.calibre ? `Calibre: ${mat.calibre}` : 'Material de Proteção')}
                            </p>
                          </div>

                          <div>
                            {isAvailable ? (
                              mat.controle_quantidade ? (
                                <div className="flex items-center gap-2 bg-slate-950 p-1 border border-slate-800 rounded-lg">
                                  {isSelected && (
                                    <button
                                      type="button"
                                      onClick={() => ajustarQuantidadeCarrinho(mat.id_material, countInCart - 1, disponivelQty + countInCart)}
                                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 rounded animate-none"
                                    >
                                      -
                                    </button>
                                  )}
                                  <span className="text-xs font-mono font-bold text-white px-2">
                                    {countInCart}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={disponivelQty <= 0}
                                    onClick={() => ajustarQuantidadeCarrinho(mat.id_material, countInCart + 1, disponivelQty + countInCart)}
                                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-200 rounded animate-none"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id={`btn-toggle-cart-${mat.id_material}`}
                                  onClick={() => toggleCartItem(mat.id_material)}
                                  className={`px-3 py-1.5 font-mono text-[9px] font-black transition-all rounded-lg uppercase cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md glow-blue'
                                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900'
                                  }`}
                                >
                                  {isSelected ? 'Remover' : 'Adicionar'}
                                </button>
                              )
                            ) : (
                              <span className="text-[8px] font-mono text-red-500 font-black uppercase bg-red-955/20 px-2 py-1 rounded border border-red-900/30">
                                {mat.status_atual}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Carregadores e Lote de Munição Customizáveis */}
                  <AnimatePresence>
                    {cartItens.some(id => {
                      const m = materiais.find(item => item.id_material === id);
                      return m && isFirearmRequiringAccessories(m);
                    }) && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="bg-[#0b1329]/60 border border-blue-900/20 rounded-lg p-3.5 flex items-start gap-3 text-xs glow-blue"
                      >
                        <Package className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-blue-300 font-mono uppercase text-[9px] tracking-wider block">Configuração de Acessórios Ativa:</strong>
                          <span className="text-slate-450 font-sans block mt-0.5 text-[11px] leading-relaxed">
                            O armamento selecionado possui dotação de munição e carregadores customizáveis. As quantidades foram especificadas na seleção e os saldos em estoque correspondentes serão atualizados no checkout.
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-between border-t border-slate-850 pt-4 mt-6 font-mono">
                  <button
                    id="btn-return-aptidao"
                    onClick={() => setPolicialStep('aptidao')}
                    className="text-xs text-slate-400 hover:text-slate-200 px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-lg transition-all cursor-pointer font-bold"
                  >
                    Voltar ao Diagnósticos
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      id="btn-open-quick-search"
                      onClick={() => {
                        setIsSearchModalOpen(true);
                        setSearchQuery('');
                        setPinError('');
                        setConfirmarCautelaPin('');
                      }}
                      className="bg-slate-950 hover:bg-slate-900 text-cyan-400 hover:text-cyan-300 font-bold font-mono py-2.5 px-4 rounded-lg text-xs flex items-center gap-1.5 border border-slate-800 hover:border-cyan-900/50 transition-all uppercase tracking-wider cursor-pointer shadow-md"
                    >
                      <Search className="h-4 w-4" />
                      <span>Busca Rápida</span>
                    </button>
                    
                    <button
                      id="btn-go-to-sign"
                      disabled={cartItens.length === 0}
                      onClick={() => {
                        if (!loggedUser?.senha_hash || loggedUser.senha_hash === '') {
                          setPolicialStep('cadastro_senha');
                        } else {
                          setPolicialStep('assinatura');
                        }
                      }}
                      className={`font-bold font-mono py-2.5 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-all uppercase tracking-wider ${
                        cartItens.length > 0
                          ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md glow-blue'
                          : 'bg-slate-955 border border-slate-850 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <span>Revisar Carga</span>
                      <ArrowRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Passo 4: Assinatura Eletrônica */}
            {policialStep === 'assinatura' && loggedUser && (
              <motion.div 
                key="assinatura-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 md:p-8 space-y-5 flex-1 flex flex-col justify-between" 
                id="policial-sign-step"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
                    <div className="bg-blue-600/10 p-2.5 rounded-lg border border-blue-500/20 text-blue-400 glow-blue">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Assinatura Digital de Cautela</h3>
                      <p className="text-xs text-slate-450 font-sans">A carga de material bélico oficial acarreta responsabilidade estatutária sobre o militar.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/65 p-4 border border-slate-850/80 space-y-3 font-mono text-xs rounded-lg">
                    <h4 className="text-blue-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-900 pb-1.5 w-fit">Inventário de Cautela Solicitado:</h4>
                    <div className="divide-y divide-slate-900 pr-1 max-h-[100px] overflow-y-auto">
                      {(() => {
                        const groupedCart = cartItens.reduce((acc, id) => {
                          acc[id] = (acc[id] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);
                        return Object.entries(groupedCart).map(([id, qty]) => {
                          const item = materiais.find(m => m.id_material === id);
                          const isQtyItem = item?.controle_quantidade;
                          return (
                            <div key={id} className="py-2 flex justify-between items-center text-[10px]">
                              <span className="text-slate-200 font-bold uppercase font-sans">
                                {item?.modelo} {isQtyItem ? `(Qtd: ${qty})` : ''}
                                {!isQtyItem && cartWeaponMagazines[id] && cartWeaponMagazines[id] > 0 ? (
                                  <span className="text-cyan-400 font-mono font-bold"> (+{cartWeaponMagazines[id]} Carregadores)</span>
                                ) : ''}
                                {!isQtyItem && cartRadioBatteries[id] ? (
                                  <span className="text-emerald-400 font-mono font-bold"> (+{cartRadioBatteries[id].qty}x Bateria {cartRadioBatteries[id].brand})</span>
                                ) : ''}
                              </span>
                              <span className="text-slate-505">
                                {isQtyItem ? 'Item Coletivo' : `Serial: ${id}`}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    <div className="bg-[#0e1629]/75 p-3 rounded-lg text-slate-400 leading-relaxed font-sans text-[10px] border border-slate-850/60">
                      <label className="text-blue-300 font-bold font-mono text-[8px] uppercase tracking-wider block mb-1">Termo de Responsabilidade PMDF:</label>
                      Declaro ter recebido da armaria do batalhão os materiais táticos descritos nesta guia em perfeito estado operacional, assumindo integral responsabilidade por sua guarda, zelo e conservação no turno de serviço.
                    </div>
                  </div>

                  {/* Observações da Escala */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider block">Observações de Serviço (Escala / Destino):</label>
                    <input
                      type="text"
                      id="input-obs-retirada"
                      value={observacoesRetirada}
                      onChange={(e) => setObservacoesRetirada(e.target.value)}
                      className="w-full bg-slate-955 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono"
                    />
                  </div>

                  {/* Confirmação de Senha ou Modo Emergencial */}
                  {isEmergencyMode ? (
                    <div className="space-y-3 border-t border-slate-850 pt-3">
                      <div className="bg-red-950/40 border border-red-800/60 p-3 rounded-lg flex items-center gap-2.5">
                        <Siren className="h-5 w-5 text-red-500 animate-pulse shrink-0" />
                        <div className="text-left">
                          <h4 className="text-xs font-bold text-red-400 font-mono uppercase">CAUTELA EMERGENCIAL ATIVA</h4>
                          <p className="text-[10px] text-slate-400 font-sans mt-0.5">Esta cautela será homologada sem exigência da senha do policial militar.</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider block">
                          Motivo da Cautela Emergencial (Opcional):
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Apoio imediato a ocorrência de roubo / Acionamento de emergência..."
                          value={motivoEmergencialInput}
                          onChange={(e) => setMotivoEmergencialInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleEfetivarCautela();
                            }
                          }}
                          className="w-full bg-slate-955 border border-red-900/50 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500 font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 border-t border-slate-850 pt-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider block">Assinatura Eletrônica (Sua Senha):</label>
                        <span className="text-[9px] text-slate-500 font-mono">Confirme para homologar</span>
                      </div>
                      <input
                        type="password"
                        id="input-confirmar-cautela-pin"
                        name="confirmarCautelaPin"
                        autoComplete="new-password"
                        maxLength={6}
                        placeholder="••••••"
                        value={confirmarCautelaPin}
                        onChange={(e) => setConfirmarCautelaPin(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleEfetivarCautela();
                          }
                        }}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-3 text-xs font-mono text-slate-200 focus:outline-none tracking-widest text-center rounded-lg transition-all focus:ring-1 focus:ring-blue-500/20 text-lg"
                      />
                    </div>
                  )}

                  {pinError && (
                    <div className="bg-red-955/30 border border-red-900/40 p-3.5 rounded-lg text-xs text-red-400 font-mono leading-normal flex items-start gap-2.5 glow-red">
                      <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-red-500" />
                      <span>{pinError}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-850 pt-4 mt-6 font-mono">
                  <button
                    id="btn-return-cart"
                    onClick={() => setPolicialStep('carrinho')}
                    className="text-xs text-slate-400 hover:text-slate-200 px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-lg transition-all cursor-pointer font-bold"
                  >
                    Alterar Carga
                  </button>

                  <button
                    id="btn-finalize-cautela"
                    onClick={handleEfetivarCautela}
                    disabled={isSubmittingCautela}
                    className={isSubmittingCautela
                      ? "opacity-60 cursor-not-allowed bg-slate-700 text-slate-300 font-bold py-2.5 px-5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md uppercase tracking-wider"
                      : (isEmergencyMode
                        ? "bg-red-600 hover:bg-red-550 text-white font-bold py-2.5 px-5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md uppercase tracking-wider cursor-pointer glow-red"
                        : "bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md uppercase tracking-wider cursor-pointer glow-blue"
                      )
                    }
                  >
                    <span>{isSubmittingCautela ? 'Gravando Cautela...' : (isEmergencyMode ? 'Efetivar Cautela Emergencial' : 'Assinar & Cautelar')}</span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Passo 5: Sucesso */}
            {policialStep === 'sucesso' && generatedCautela && loggedUser && (
              <motion.div 
                key="sucesso-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 md:p-8 space-y-6 flex-1 flex flex-col justify-center text-center max-w-3xl mx-auto w-full" 
                id="policial-success-step"
              >
                <div className="space-y-2.5">
                  <div className="bg-emerald-500/10 text-emerald-450 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] glow-emerald">
                    <CheckCircle className="h-11 w-11 text-emerald-400" />
                  </div>
                  <span className="text-xs text-emerald-450 font-bold uppercase tracking-wider font-mono block">TRANSAÇÃO RELACIONAL ACID CONCLUÍDA</span>
                  <h3 className="text-2xl font-black text-white font-mono uppercase tracking-wide">Guia Eletrônica de Cautela Emitida</h3>
                  <p className="text-sm text-slate-350 leading-relaxed font-sans max-w-2xl mx-auto">A carga foi debitada no estoque do paiol e associada à sua matrícula. O armamento está liberado na portaria.</p>
                </div>

                {/* Recibo Tático */}
                <div className="bg-slate-955 p-6 md:p-8 border border-slate-850 text-left space-y-5 font-mono text-sm relative overflow-hidden rounded-xl shadow-xl">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500" />

                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-900 pb-3">
                    <span>GUIA ID: {generatedCautela.id_cautela}</span>
                    <span>{new Date(generatedCautela.data_retirada).toLocaleString()}</span>
                  </div>

                  <div className="space-y-3 text-xs text-slate-300">
                    <p className="text-sm">Militar Beneficiário: <strong className="text-white font-sans font-bold text-base ml-1">{formatPostoGraduacaoSigla(loggedUser.posto_graduacao)} {loggedUser.nome_de_guerra || loggedUser.nome} ({loggedUser.matricula})</strong></p>
                    
                    {generatedCautela.is_emergencial && (
                      <div className="bg-red-950/60 border border-red-800/80 rounded-lg p-3 my-2 text-left">
                        <div className="flex items-center gap-2 text-xs font-mono font-black text-red-400 uppercase tracking-wider">
                          <Siren className="h-4.5 w-4.5 shrink-0 animate-pulse text-red-500" />
                          <span>CAUTELA EMERGENCIAL (SEM USO DE SENHA)</span>
                        </div>
                        {generatedCautela.motivo_emergencial && (
                          <p className="text-xs font-mono text-slate-300 mt-1.5 pl-6">
                            <strong>Motivo registrado pelo Armeiro:</strong> {generatedCautela.motivo_emergencial}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="font-bold border-b border-slate-900 pb-2 text-slate-400 text-xs tracking-wider uppercase">MATERIAIS CAUTELADOS:</p>
                    <ul className="list-disc pl-5 space-y-1.5 text-slate-100 font-sans">
                      {(() => {
                        const groupedCart = cartItens.reduce((acc, id) => {
                          acc[id] = (acc[id] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);
                        return Object.entries(groupedCart).map(([id, qty]) => {
                          const item = materiais.find(m => m.id_material === id);
                          const isQtyItem = item?.controle_quantidade;
                          return (
                            <li key={id} className="font-mono text-sm text-slate-100 font-bold">
                              {item?.modelo} {isQtyItem ? <strong className="text-blue-400"> (Qtd: {qty})</strong> : <span className="text-xs text-slate-400 font-mono font-normal">(S/N: {id})</span>}
                              {!isQtyItem && cartWeaponMagazines[id] && cartWeaponMagazines[id] > 0 ? (
                                <strong className="text-cyan-400"> (+{cartWeaponMagazines[id]} Carregadores)</strong>
                              ) : ''}
                              {!isQtyItem && cartRadioBatteries[id] ? (
                                <strong className="text-emerald-400"> (+{cartRadioBatteries[id].qty}x Bateria {cartRadioBatteries[id].brand})</strong>
                              ) : ''}
                            </li>
                          );
                        });
                      })()}
                    </ul>
                    
                    {(() => {
                      const accItens = cartItens.filter(id => {
                        const m = materiais.find(item => item.id_material === id);
                        return m?.id_categoria === 'CAT-MUNICAO';
                      });
                      if (accItens.length === 0) return null;
                      
                      const groupedAcc = accItens.reduce((acc, id) => {
                        acc[id] = (acc[id] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      const summary = Object.entries(groupedAcc).map(([id, qty]) => {
                        const m = materiais.find(item => item.id_material === id);
                        return `${qty}x ${m?.modelo || id}`;
                      }).join(', ');

                      return (
                        <div className="bg-[#0b1329]/50 p-2.5 rounded border border-blue-900/20 mt-2 font-mono text-[9px] text-cyan-400">
                          + ACESSÓRIOS CONFIGURADOS: {summary}
                        </div>
                      );
                    })()}
                    
                    <p className="border-t border-slate-900 pt-3 text-xs text-slate-350">Previsão de Baixa Obrigatória: <strong className="text-amber-400 font-bold text-sm ml-1">{new Date(generatedCautela.previsao_devolucao).toLocaleString()}</strong></p>
                  </div>

                  <div className="border-t border-slate-900 pt-2 text-[8px] text-slate-500 flex justify-between items-center">
                    <span>SGBD: SQL SERVER COM BIOMETRIA SHA-256</span>
                    <span className="font-bold text-blue-500">ASSINADO E HOMOLOGADO</span>
                  </div>
                </div>

                <button
                  id="btn-new-cautela-flow"
                  onClick={handleLogoutPolicial}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-blue-900 font-mono text-slate-400 hover:text-blue-300 py-3 rounded-lg text-xs transition-colors uppercase tracking-wider font-bold cursor-pointer"
                >
                  Encerrar Sessão e Liberar Totem
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de Busca Rápida & Assinatura */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            id="modal-quick-search-wrapper"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[98vw] lg:max-w-[95vw] max-h-[94vh] overflow-hidden flex flex-col shadow-2xl relative text-left"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-500/10 p-2.5 rounded-lg border border-cyan-500/20 text-cyan-400">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono">Busca Rápida & Cautela Tática</h3>
                    <p className="text-xs text-slate-400 font-sans">Pesquise materiais e assine digitalmente nesta mesma tela.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchModalOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-450 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Corpo */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                
                {/* Lado Esquerdo: Busca e Resultados */}
                <div className="lg:col-span-8 flex flex-col space-y-4 overflow-hidden h-full">
                  <div className="relative">
                    <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      name="searchQuery"
                      autoComplete="off"
                      placeholder="Pesquisar por nome do material (ex: Glock) ou código/serial (ex: TX-983829)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 p-4 pl-12 text-sm font-mono text-slate-100 focus:outline-none rounded-xl transition-all focus:ring-1 focus:ring-cyan-500/20 placeholder:text-slate-500 font-medium"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[480px] lg:max-h-[580px]">
                    {materiais
                      .filter(mat => {
                        const q = searchQuery.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          mat.modelo.toLowerCase().includes(q) || 
                          mat.id_material.toLowerCase().includes(q) ||
                          (mat.calibre && mat.calibre.toLowerCase().includes(q))
                        );
                      })
                      .length === 0 ? (
                      <div className="text-center p-8 border border-dashed border-slate-800 rounded-lg text-slate-500 font-mono text-xs">
                        Nenhum material bélico localizado para "{searchQuery}".
                      </div>
                    ) : (
                      materiais
                        .filter(mat => {
                          const q = searchQuery.toLowerCase().trim();
                          if (!q) return true;
                          return (
                            mat.modelo.toLowerCase().includes(q) || 
                            mat.id_material.toLowerCase().includes(q) ||
                            (mat.calibre && mat.calibre.toLowerCase().includes(q))
                          );
                        })
                        .map((mat) => {
                          const countInCart = cartItens.filter(id => id === mat.id_material).length;
                          const isSelected = countInCart > 0;
                          const disponivelQty = getDisponivelQty(mat);
                          const isAvailable = mat.controle_quantidade ? (disponivelQty > 0 || isSelected) : (mat.status_atual === 'disponivel');
                          
                          return (
                            <div
                              key={mat.id_material}
                              className={`p-3 border rounded-lg flex items-center justify-between gap-3 transition-all duration-150 ${
                                isSelected
                                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.05)]'
                                  : isAvailable
                                  ? 'bg-slate-955 border border-slate-850 text-slate-350 hover:border-slate-750 hover:bg-slate-950/80'
                                  : 'bg-slate-950/10 border-slate-900/60 text-slate-600 opacity-55 cursor-not-allowed'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[8px] px-2 py-0.5 rounded font-black font-mono border ${
                                    mat.id_categoria === 'CAT-ARMA-CURTA' || mat.id_categoria === 'CAT-ARMA-LONGA'
                                      ? 'bg-cyan-955/50 text-cyan-400 border-cyan-900/30'
                                      : 'bg-slate-900 text-slate-400 border-slate-800'
                                  }`}>
                                    {mat.id_categoria.replace('CAT-', '')}
                                  </span>
                                  {mat.controle_quantidade && (
                                    <span className="text-[9px] text-slate-500 font-mono font-bold">
                                      {`Item Coletivo (Disp: ${disponivelQty})`}
                                    </span>
                                  )}
                                  {isItemExpired(mat.data_validade) && (
                                    <span className="text-[8px] px-2 py-0.5 bg-red-950/70 text-red-400 border border-red-900/40 rounded font-black font-mono animate-pulse uppercase tracking-wider">
                                      Vencido
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-base font-black uppercase text-slate-100 flex items-center gap-2">
                                  <span>{mat.modelo}</span>
                                  <span className="inline-flex items-center justify-center bg-slate-950 border border-slate-800 text-slate-200 px-2 py-0.5 rounded font-mono text-xs font-bold tracking-normal shrink-0">
                                    {mat.id_material}
                                  </span>
                                </h4>
                                <p className="text-[9px] text-slate-500 font-mono">{mat.calibre !== 'N/A' && mat.calibre ? `Calibre: ${mat.calibre}` : 'Material de Proteção'}</p>
                              </div>

                              <div>
                                {isAvailable ? (
                                  mat.controle_quantidade ? (
                                    <div className="flex items-center gap-2 bg-slate-950 p-1 border border-slate-800 rounded-lg">
                                      {isSelected && (
                                        <button
                                          type="button"
                                          onClick={() => ajustarQuantidadeCarrinho(mat.id_material, countInCart - 1, disponivelQty + countInCart)}
                                          className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-xs font-bold text-slate-200 rounded animate-none"
                                        >
                                          -
                                        </button>
                                      )}
                                      <span className="text-xs font-mono font-bold text-white px-2">
                                        {countInCart}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={disponivelQty <= 0}
                                        onClick={() => ajustarQuantidadeCarrinho(mat.id_material, countInCart + 1, disponivelQty + countInCart)}
                                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-200 rounded animate-none"
                                      >
                                        +
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => toggleCartItem(mat.id_material)}
                                      className={`px-3 py-1.5 font-mono text-[9px] font-black transition-all rounded-lg uppercase cursor-pointer ${
                                        isSelected
                                          ? 'bg-cyan-600 hover:bg-cyan-550 text-white shadow-md'
                                          : 'bg-slate-955 border border-slate-800 text-slate-300 hover:bg-slate-900'
                                      }`}
                                    >
                                      {isSelected ? 'Remover' : 'Selecionar'}
                                    </button>
                                  )
                                ) : (
                                  <span className="text-[8px] font-mono text-red-500 font-black uppercase bg-red-955/20 px-2 py-1 rounded border border-red-900/30">
                                    {mat.status_atual}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                  {/* Lado Direito: Carga Selecionada e Assinatura */}
                  <div className="lg:col-span-4 flex flex-col space-y-4 justify-between h-full border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                  
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px] lg:max-h-none">
                    <span className="text-xs font-mono font-bold text-slate-350 uppercase tracking-wider block">Itens Selecionados ({cartItens.length}):</span>
                    {cartItens.length === 0 ? (
                      <div className="p-4 border border-slate-800 rounded-lg text-center text-slate-505 text-xs font-mono">
                        Nenhum item selecionado. Use a busca ao lado para adicionar.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {(() => {
                          const groupedCart = cartItens.reduce((acc, id) => {
                            acc[id] = (acc[id] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          return Object.entries(groupedCart).map(([id, qty]) => {
                            const item = materiais.find(m => m.id_material === id);
                            const isQtyItem = item?.controle_quantidade;
                            return (
                              <div key={id} className="bg-slate-955 border border-slate-850 p-3 rounded-lg flex justify-between items-center text-xs font-mono">
                                <div className="truncate pr-2">
                                  <p className="text-white uppercase font-sans font-bold truncate text-xs">
                                    {item?.modelo} {isQtyItem ? `(Qtd: ${qty})` : ''}
                                    {!isQtyItem && cartWeaponMagazines[id] && cartWeaponMagazines[id] > 0 ? (
                                      <span className="text-cyan-400 font-mono font-bold"> (+{cartWeaponMagazines[id]} Carg)</span>
                                    ) : ''}
                                    {!isQtyItem && cartRadioBatteries[id] ? (
                                      <span className="text-emerald-400 font-mono font-bold"> (+{cartRadioBatteries[id].qty}x Bat {cartRadioBatteries[id].brand})</span>
                                    ) : ''}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {isQtyItem ? 'Item Coletivo' : `CÓD: ${id}`}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCartItens(prev => prev.filter(x => x !== id));
                                  }}
                                  className="text-slate-505 hover:text-red-400 transition-colors p-1 cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Campo de Senha (PIN) e Confirmação */}
                  {!loggedUser?.senha_hash || loggedUser.senha_hash === '' ? (
                    <div className="space-y-3 bg-slate-950/60 p-3.5 border border-slate-850 rounded-xl mt-auto text-center">
                      <p className="text-[11px] text-slate-400 font-sans">
                        Você ainda não possui uma senha de assinatura eletrônica cadastrada.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchModalOpen(false);
                          setPolicialStep('cadastro_senha');
                        }}
                        className="w-full bg-cyan-600 hover:bg-cyan-550 text-white font-bold font-mono py-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider cursor-pointer font-black"
                      >
                        <KeyRound className="h-4 w-4 text-cyan-200" />
                        <span>Cadastrar Senha</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-950/60 p-3.5 border border-slate-850 rounded-xl mt-auto">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider block">Assinatura Eletrônica (Sua Senha):</label>
                        <input
                          type="password"
                          name="confirmarCautelaPin"
                          autoComplete="new-password"
                          maxLength={6}
                          placeholder="••••••"
                          value={confirmarCautelaPin}
                          onChange={(e) => setConfirmarCautelaPin(e.target.value.replace(/\D/g, ''))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleEfetivarCautela();
                            }
                          }}
                          className="w-full bg-slate-955 border border-slate-800 focus:border-cyan-550 p-2.5 text-xs font-mono text-slate-200 focus:outline-none tracking-widest text-center rounded-lg transition-all focus:ring-1 focus:ring-cyan-500/20 text-lg"
                        />
                      </div>

                      {pinError && (
                        <div className="bg-red-955/30 border border-red-900/40 p-2.5 rounded-lg text-[10px] text-red-400 font-mono leading-normal flex items-start gap-2">
                          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                          <span>{pinError}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleEfetivarCautela}
                        disabled={cartItens.length === 0 || isSubmittingCautela}
                        className={`w-full font-bold font-mono py-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider ${
                          cartItens.length > 0 && !isSubmittingCautela
                            ? 'bg-cyan-600 hover:bg-cyan-550 text-white cursor-pointer shadow-md glow-cyan font-black'
                            : 'bg-slate-955 border border-slate-850 text-slate-650 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <FileCheck2 className="h-4 w-4" />
                        <span>{isSubmittingCautela ? 'Gravando Cautela...' : 'Confirmar & Cautelar'}</span>
                      </button>
                    </div>
                  )}

                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Configuração de Acessórios (Munições/Carregadores) */}
      <AnimatePresence>
        {isAccessoryModalOpen && selectedAccessoryWeapon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-955/85 backdrop-blur-md"
            id="modal-accessories-wrapper"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl relative text-left"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20 text-blue-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Dotação de Acessórios</h3>
                    <p className="text-[10px] text-slate-450 font-sans">Especifique as quantidades para o armamento selecionado.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAccessoryModalOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-455 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Corpo */}
              <div className="p-6 space-y-6">
                <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-[8px] px-2 py-0.5 rounded font-black font-mono border bg-blue-950/70 text-blue-400 border-blue-900/40 uppercase">
                    Armamento Selecionado
                  </span>
                  <h4 className="text-sm font-black text-white uppercase mt-1.5">{selectedAccessoryWeapon.modelo}</h4>
                </div>

                {/* Seletores */}
                {(() => {
                  const radioInfo = getRadioInfo(selectedAccessoryWeapon);
                  const maxMag = selectedAccessoryWeapon.quantidade_carregadores || 0;
                  const isWeapon = isFirearmRequiringAccessories(selectedAccessoryWeapon);

                  return (
                    <div className="space-y-4">
                      {/* Baterias (para Rádios HT Hytera / Sepura) */}
                      {radioInfo.isRadio && (
                        <div className="flex items-center justify-between p-3.5 bg-slate-955/60 border border-slate-800 rounded-xl">
                          <div>
                            <span className="text-[8px] px-2 py-0.5 rounded font-black font-mono border bg-emerald-950/70 text-emerald-400 border-emerald-900/40 uppercase block mb-1 w-fit">
                              Bateria {radioInfo.brand}
                            </span>
                            <h5 className="text-xs font-bold text-slate-200 uppercase font-mono">Baterias do Rádio HT</h5>
                            <p className="text-[10px] text-slate-450 font-sans">
                              Quantidade de baterias para este rádio (Padrão: 1 un.)
                            </p>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-950 p-1.5 border border-slate-800 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setSelectedAccessoryBatteryQty(prev => Math.max(0, prev - 1))}
                              className="w-7 h-7 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 rounded flex items-center justify-center transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono font-bold text-emerald-400 w-6 text-center">
                              {selectedAccessoryBatteryQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedAccessoryBatteryQty(prev => prev + 1)}
                              className="w-7 h-7 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 rounded flex items-center justify-center transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Carregadores (para Armamentos) */}
                      {isWeapon && (
                        <div className="flex items-center justify-between p-3 bg-slate-950/30 border border-slate-850/60 rounded-xl">
                          <div>
                            <h5 className="text-xs font-bold text-slate-200 uppercase font-mono">Carregadores da Arma</h5>
                            <p className="text-[10px] text-slate-500 font-sans">
                              Disponíveis com esta arma: <span className="text-slate-350 font-bold">{maxMag} un.</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-3 bg-slate-950 p-1.5 border border-slate-800 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setSelectedAccessoryMagQty(prev => Math.max(0, prev - 1))}
                              className="w-7 h-7 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 rounded flex items-center justify-center transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono font-bold text-white w-6 text-center">
                              {selectedAccessoryMagQty}
                            </span>
                            <button
                              type="button"
                              disabled={selectedAccessoryMagQty >= maxMag}
                              onClick={() => setSelectedAccessoryMagQty(prev => Math.min(maxMag, prev + 1))}
                              className="w-7 h-7 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-200 rounded flex items-center justify-center transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Ações */}
              <div className="p-5 border-t border-slate-800 bg-slate-950/20 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAccessoryModalOpen(false)}
                  className="flex-1 bg-transparent hover:bg-slate-950/50 text-slate-400 hover:text-slate-200 border border-slate-800 font-mono py-2.5 rounded-lg text-xs transition-all uppercase tracking-wider cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedAccessoryWeapon) {
                      const radioInfo = getRadioInfo(selectedAccessoryWeapon);
                      if (radioInfo.isRadio && radioInfo.brand) {
                        setCartRadioBatteries(prev => ({
                          ...prev,
                          [selectedAccessoryWeapon.id_material]: {
                            brand: radioInfo.brand!,
                            qty: selectedAccessoryBatteryQty
                          }
                        }));
                      }
                      if (isFirearmRequiringAccessories(selectedAccessoryWeapon)) {
                        setCartWeaponMagazines(prev => ({
                          ...prev,
                          [selectedAccessoryWeapon.id_material]: selectedAccessoryMagQty
                        }));
                      }
                      if (!cartItens.includes(selectedAccessoryWeapon.id_material)) {
                        setCartItens(prev => [...prev, selectedAccessoryWeapon.id_material]);
                      }
                    }
                    setIsAccessoryModalOpen(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-2.5 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider cursor-pointer text-center glow-blue"
                >
                  Confirmar Carga
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Cadastro de Novo Policial pelo Totem */}
      <AnimatePresence>
        {isCadastroModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-955/85 backdrop-blur-md"
            id="modal-cadastro-policial-totem"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl relative text-left"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20 text-blue-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Cadastrar Novo Usuário (Policial / Civil)</h3>
                    <p className="text-[10px] text-slate-450 font-sans">Insira os dados cadastrais para liberação de acesso imediato.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCadastroModalOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-455 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCadastrarNovoUsuarioSubmit}>
                {/* Corpo */}
                <div className="p-6 space-y-4">
                  
                  {/* Matrícula / Documento */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide block">Matrícula (RG Funcional / CPF / Identificação):</label>
                    <input
                      type="text"
                      disabled
                      value={matriculaInput.trim().toUpperCase()}
                      className="w-full bg-slate-950/60 border border-slate-850 p-2.5 text-xs font-mono text-slate-500 rounded-lg cursor-not-allowed uppercase"
                    />
                  </div>

                  {/* Nome Completo */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide block">Nome Completo:</label>
                    <input
                      type="text"
                      required
                      placeholder="EX: JEAN-CLAUDE VAN DAMME"
                      value={newNome}
                      onChange={(e) => setNewNome(e.target.value)}
                      className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Nome de Guerra */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide block">Nome de Guerra:</label>
                    <input
                      type="text"
                      required
                      placeholder="EX: VAN DAMME"
                      value={newNomeDeGuerra}
                      onChange={(e) => setNewNomeDeGuerra(e.target.value)}
                      className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Posto / Graduação */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Posto / Graduação:</label>
                      <select
                        value={newPosto}
                        onChange={(e) => setNewPosto(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg cursor-pointer"
                      >
                        {POSTOS_GRADUACOES_EXTENSO.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    {/* Situação do Porte / Cautela */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Situação do Porte / Cautela:</label>
                      <select
                        value={newSituacao}
                        onChange={(e) => setNewSituacao(e.target.value as SituacaoMilitar)}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-blue-500 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg cursor-pointer"
                      >
                        <option value="apto">Ativo (Apto)</option>
                        <option value="suspenso">Suspenso</option>
                        <option value="restrito_servico">Restrito ao Serviço</option>
                      </select>
                    </div>
                  </div>

                  {cadastroError && (
                    <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-start gap-2 animate-pulse glow-red">
                      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{cadastroError}</span>
                    </div>
                  )}

                </div>

                {/* Ações */}
                <div className="p-5 border-t border-slate-800 bg-slate-950/20 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCadastroModalOpen(false)}
                    className="flex-1 bg-transparent hover:bg-slate-955/50 text-slate-400 hover:text-slate-200 border border-slate-800 font-mono py-2.5 rounded-lg text-xs transition-all uppercase tracking-wider cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-2.5 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider cursor-pointer text-center glow-blue"
                  >
                    Salvar e Entrar
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
