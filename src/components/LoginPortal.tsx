/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, ShieldAlert, CheckCircle, RefreshCw, Eye, EyeOff, Building2, ArrowLeft, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { Usuario, Quartel } from '../types';
import { supabase, obterAmbienteAtual, alterarAmbiente } from '../supabaseClient';
import { comparePassword, hashSHA256 } from '../utils/crypto';
import { useAppUpdater } from '../hooks/useAppUpdater';
import packageJson from '../../package.json';

interface LoginPortalProps {
  onLoginSuccess: (usuario: Usuario, quartel: Quartel | null) => void;
  cadastrarSenha: (matricula: string, novaSenha: string) => void;
  quarteis: Quartel[];
}

export default function LoginPortal({
  onLoginSuccess,
  cadastrarSenha,
  quarteis
}: LoginPortalProps) {
  // ---- SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA ----
  const { 
    updateAvailable, 
    newVersion, 
    isDownloading, 
    error: updaterError, 
    checkUpdates, 
    installUpdate 
  } = useAppUpdater();

  const [isChecking, setIsChecking] = useState(false);
  const [checkedSuccessfully, setCheckedSuccessfully] = useState(false);

  const handleCheckClick = async () => {
    if (isChecking || isDownloading) return;
    setIsChecking(true);
    setCheckedSuccessfully(false);
    try {
      const update = await checkUpdates(false);
      if (!update) {
        setCheckedSuccessfully(true);
        setTimeout(() => setCheckedSuccessfully(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstallClick = async () => {
    if (window.confirm(`Deseja baixar e instalar a versão v${newVersion} agora? O aplicativo será reiniciado automaticamente após a instalação.`)) {
      await installUpdate();
    }
  };

  // ---- FLUXO DA TELA ----
  const [step, setStep] = useState<'login' | 'primeiro_acesso' | 'sucesso'>('login');
  const [selectedQuartel, setSelectedQuartel] = useState<Quartel | null>(null);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  
  // ---- ESTADOS DOS CAMPOS ----
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // ---- ESTADOS DO PRIMEIRO ACESSO ----
  const [newSenha, setNewSenha] = useState('');
  const [confirmNewSenha, setConfirmNewSenha] = useState('');
  const [primeiroAcessoUser, setPrimeiroAcessoUser] = useState<Usuario | null>(null);
  
  // ---- ESTADOS DE CARREGAMENTO ----
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Seleciona o RPMON (ou a Cavalaria) por padrão ao iniciar
  useEffect(() => {
    if (quarteis && quarteis.length > 0 && !selectedQuartel && !isAdminLogin) {
      const cavalaria = quarteis.find(
        q => q.slug.includes('cavalaria') || 
             q.nome.toLowerCase().includes('cavalaria') || 
             q.nome.toLowerCase().includes('rpmon')
      );
      if (cavalaria) {
        setSelectedQuartel(cavalaria);
      } else {
        setSelectedQuartel(quarteis[0]);
      }
    }
  }, [quarteis, selectedQuartel, isAdminLogin]);

  // ---- SUBMIT DO LOGIN ----
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    const matriculaNorm = matricula.trim().toUpperCase();
    const senhaNorm = senha.trim();

    try {
      // 1. Consultar a tabela usuarios para obter informações básicas (como perfil)
      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('matricula', matriculaNorm)
        .single();


      if (userError || !user) {
        setAuthError('Matrícula funcional não encontrada no SGBD.');
        setIsAuthenticating(false);
        return;
      }

      // Validar se é primeiro acesso (senha em branco)
      // Se não tiver auth_user_id ou senha_hash, é primeiro acesso
      if ((user.senha_hash === '' || !user.senha_hash) && !user.auth_user_id) {
        setPrimeiroAcessoUser(user);
        setStep('primeiro_acesso');
        setIsAuthenticating(false);
        return;
      }

      // Validar se o usuário é admin
      if (user.perfil === 'admin') {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: `${matriculaNorm.toLowerCase()}@admin.pm`,
          password: senhaNorm,
        });
        if (authErr) {
          // Fallback para admin caso dê rate limit
          if (authErr.message.includes('rate limit') || authErr.message.includes('exceeded') || authErr.status === 429) {
            const hashedInput = await hashSHA256(senhaNorm);
            const { data: dbAdmin } = await supabase
              .from('usuarios')
              .select('senha_hash')
              .eq('matricula', matriculaNorm)
              .single();
              
            if (dbAdmin && dbAdmin.senha_hash === hashedInput) {
              console.warn('Autenticação local realizada para Admin devido a rate limit no Auth.');
              setStep('sucesso');
              setTimeout(() => { onLoginSuccess(user, null); }, 1000);
              return;
            }
          }
          sessionStorage.removeItem('logging_in');
          setAuthError('Matrícula funcional não encontrada no SGBD.');
          setIsAuthenticating(false);
          return;
        }

        // Se o admin foi autenticado com sucesso no Auth, mas seu auth_user_id no banco ainda não está vinculado, vinculamos agora usando a RPC (SECURITY DEFINER)
        if (authData.user && user.auth_user_id !== authData.user.id) {
          const { error: linkErr } = await supabase.rpc('vincular_usuario_auth', {
            p_matricula: matriculaNorm,
            p_auth_id: authData.user.id
          });
          
          if (linkErr) {
            console.error('Erro ao vincular auth_user_id do admin:', linkErr);
          } else {
            console.log('Vinculo de auth_user_id do admin realizado com sucesso!');
            user.auth_user_id = authData.user.id;
          }
        }

        setStep('sucesso');
        setTimeout(() => { onLoginSuccess(user, null); }, 1000);
        return;
      }

      // Validar se é armeiro
      if (user.perfil !== 'armeiro_gestor') {
        setAuthError('Acesso restrito. Este terminal é exclusivo para Armeiros Gestores e Administradores.');
        setIsAuthenticating(false);
        return;
      }

      // Verificar se um quartel foi selecionado
      if (!selectedQuartel) {
        setAuthError('Selecione o quartel antes de fazer login.');
        setIsAuthenticating(false);
        return;
      }

      // Validar se o armeiro pertence ao quartel selecionado
      if (user.id_quartel !== selectedQuartel.id) {
        setAuthError('Acesso negado. Sua matrícula está vinculada a outro quartel.');
        setIsAuthenticating(false);
        return;
      }

      // Sinalizar que estamos realizando o fluxo de login manual (para evitar que o listener de auth corte a animação)
      sessionStorage.setItem('logging_in', 'true');

      // 2. Tentar autenticação via Supabase Auth
      let authData = null;
      let authError = null;

      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: `${matriculaNorm.toLowerCase()}@${selectedQuartel.slug.toLowerCase()}.pm`,
          password: senhaNorm,
        });
        authData = signInData;
        authError = signInError;
      } catch (err: any) {
        authError = err;
      }

      // Fallback: se falhar por credenciais incorretas (ou conta não cadastrada no quartel correspondente)
      // e o quartel selecionado não for a cavalaria, tentar logar usando o domínio cavalaria.pm como contingência
      // (caso a Edge Function antiga do Supabase na nuvem tenha forçado a criação da conta sob este domínio).
      if (authError && selectedQuartel.slug.toLowerCase() !== 'cavalaria' && !authError.message?.includes('rate limit')) {
        console.warn('Login com o domínio do quartel selecionado falhou. Executando fallback com o domínio cavalaria...');
        try {
          const { data: fbData, error: fbError } = await supabase.auth.signInWithPassword({
            email: `${matriculaNorm.toLowerCase()}@cavalaria.pm`,
            password: senhaNorm,
          });
          if (!fbError) {
            authData = fbData;
            authError = null;
            console.log('Login com domínio cavalaria (fallback) autenticado com sucesso!');
          }
        } catch (fbErr) {
          console.error('Erro no login de fallback cavalaria:', fbErr);
        }
      }

      if (authError) {
        // Caso o usuário não tenha conta criada no Auth (por falha no cadastro/Edge Function),
        // vamos validar a senha localmente e fazer auto-cadastro automático se a senha bater.
        if (!user.auth_user_id) {
          const hashedInput = await hashSHA256(senhaNorm);
          if (user.senha_hash === hashedInput) {
            console.log('Detectado armeiro cadastrado sem conta de login ativa no Auth. Efetuando auto-cadastro...');
            const emailAuth = `${matriculaNorm.toLowerCase()}@${selectedQuartel.slug.toLowerCase()}.pm`;
            
            try {
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: emailAuth,
                password: senhaNorm,
              });

              if (!signUpError && signUpData.user) {
                console.log('Auto-cadastro realizado com sucesso para o Armeiro:', matriculaNorm);
                                // Vincular o auth_user_id no banco de dados usando RPC (SECURITY DEFINER)
                 const { error: linkErr } = await supabase.rpc('vincular_usuario_auth', {
                   p_matricula: matriculaNorm,
                   p_auth_id: signUpData.user.id
                 });
                 
                 if (linkErr) {
                   console.error('Erro ao vincular auth_user_id do armeiro:', linkErr);
                 } else {
                   console.log('Vinculo de auth_user_id do armeiro realizado com sucesso!');
                   user.auth_user_id = signUpData.user.id;
                 }

                sessionStorage.removeItem('logging_in');
                setStep('sucesso');
                setTimeout(() => {
                  onLoginSuccess(user, selectedQuartel);
                }, 1000);
                return;
              } else {
                console.error('Falha ao tentar auto-cadastrar usuário no Auth:', signUpError);
              }
            } catch (signUpErr) {
              console.error('Erro inesperado no auto-cadastro do Auth:', signUpErr);
            }
          }
        }

        // Fallback para armeiro caso dê rate limit
        if (authError.message.includes('rate limit') || authError.message.includes('exceeded') || authError.status === 429) {
          const hashedInput = await hashSHA256(senhaNorm);
          const { data: dbUserWithHash } = await supabase
            .from('usuarios')
            .select('senha_hash')
            .eq('matricula', matriculaNorm)
            .single();
            
          if (dbUserWithHash && dbUserWithHash.senha_hash === hashedInput) {
            console.warn('Autenticação local realizada com sucesso devido a rate limit no Auth.');
            sessionStorage.removeItem('logging_in');
            setStep('sucesso');
            setTimeout(() => {
              onLoginSuccess(user, selectedQuartel);
            }, 1000);
            return;
          }
        }
        sessionStorage.removeItem('logging_in');
        setAuthError('Senha de acesso incorreta ou usuário não cadastrado no Supabase Auth.');
        setIsAuthenticating(false);
        return;
      }

      // Se o usuário foi autenticado com sucesso no Auth, mas seu auth_user_id no banco ainda não está vinculado, vinculamos agora!
      if (authData.user && user.auth_user_id !== authData.user.id) {
        await supabase
          .from('usuarios')
          .update({ auth_user_id: authData.user.id })
          .eq('matricula', matriculaNorm);
        
        user.auth_user_id = authData.user.id;
      }

      // Sucesso no login
      setStep('sucesso');
      setTimeout(() => {
        onLoginSuccess(user, selectedQuartel);
      }, 1000);
    } catch (err) {
      console.error('Erro de autenticação:', err);
      sessionStorage.removeItem('logging_in');
      setAuthError('Falha de conexão com o SGBD.');
      setIsAuthenticating(false);
    }
  };

  // ---- SUBMIT DO PRIMEIRO ACESSO ----
  const handlePrimeiroAcessoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    const newPwdTrim = newSenha.trim();
    const confirmPwdTrim = confirmNewSenha.trim();

    if (!primeiroAcessoUser) return;

    if (newPwdTrim.length < 4) {
      setAuthError('A senha deve conter no mínimo 4 dígitos.');
      setIsAuthenticating(false);
      return;
    }

    if (newPwdTrim !== confirmPwdTrim) {
      setAuthError('A confirmação da nova senha não confere.');
      setIsAuthenticating(false);
      return;
    }

    try {
      sessionStorage.setItem('logging_in', 'true');
      const matriculaNorm = primeiroAcessoUser.matricula.toUpperCase();
      const emailAuth = (primeiroAcessoUser.perfil === 'admin'
        ? `${matriculaNorm}@admin.pm`
        : `${matriculaNorm}@${selectedQuartel?.slug || 'cavalaria'}.pm`).toLowerCase();

      let authUserId = null;

      // Criar a conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailAuth,
        password: newPwdTrim,
      });

      if (authError) {
        // Fallback se der rate limit no signUp do Auth
        if (authError.message.includes('rate limit') || authError.message.includes('exceeded') || authError.status === 429) {
          console.warn('Supabase Auth rate limit detectado no cadastro. Prosseguindo com ID provisório.');
          authUserId = `local-${crypto.randomUUID()}`;
        } else {
          sessionStorage.removeItem('logging_in');
          setAuthError(`Erro ao registrar no Auth: ${authError.message}`);
          setIsAuthenticating(false);
          return;
        }
      } else {
        authUserId = authData.user?.id;
      }

      if (!authUserId) {
        sessionStorage.removeItem('logging_in');
        setAuthError('Erro ao obter identificador do usuário autenticado.');
        setIsAuthenticating(false);
        return;
      }

      const hashed = await hashSHA256(newPwdTrim);

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ 
          auth_user_id: authUserId,
          senha_hash: hashed 
        })
        .eq('matricula', matriculaNorm);

      if (updateError) {
        console.error('Erro ao atualizar usuarios com auth_user_id:', updateError);
      }

      // Sincronizar senha localmente se o app precisar
      cadastrarSenha(primeiroAcessoUser.matricula, newPwdTrim);

      // Transitar para sucesso
      setStep('sucesso');
      setTimeout(() => {
        onLoginSuccess({ 
          ...primeiroAcessoUser, 
          auth_user_id: authUserId,
          senha_hash: hashed 
        }, selectedQuartel);
      }, 1000);
    } catch (err) {
      console.error('Erro no primeiro acesso:', err);
      sessionStorage.removeItem('logging_in');
      setAuthError('Falha ao registrar credenciais de primeiro acesso.');
      setIsAuthenticating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-955 flex items-center justify-center p-4 z-[999] overflow-y-auto selection:bg-blue-600 selection:text-white bg-cover bg-center bg-no-repeat" 
      style={{ backgroundImage: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(9, 15, 30, 0.95)), url("/cavalry_bg.png")' }}
      id="login-portal-root"
    >
      
      {/* Background Matrix/Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl relative"
      >
        {/* Glow Borders */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-sm pointer-events-none"></div>
        
        {/* TOP BRANDING HUD */}
        <div className="text-center space-y-3 mb-8 relative">
          <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/40 rounded-xl flex items-center justify-center font-bold text-blue-400 mx-auto shadow-[0_0_20px_rgba(59,130,246,0.2)] glow-blue">
            <Shield className="h-7 w-7 text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-sm font-extrabold tracking-wider uppercase text-white font-sans">
                RESERVA DE ARMAMENTO
              </h2>
              <span className="text-[8px] bg-blue-955 text-blue-400 border border-blue-900/60 px-1 py-0.5 rounded font-black font-mono">PMDF</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">SISTEMA TÁTICO DE CONTROLE BÉLICO</p>
          </div>
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
        </div>

        {/* FORMULÁRIO DE LOGIN COM SELETOR INLINE */}
        {step === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5 relative font-sans text-xs">
            
            {/* HUD de Seleção de Unidade Bélica via Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Unidade Bélica:</label>
              <div className="relative">
                <select
                  value={selectedQuartel?.id || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const q = quarteis.find(item => item.id === val);
                    if (q) {
                      setSelectedQuartel(q);
                    }
                    setAuthError('');
                  }}
                  className="w-full bg-slate-950/80 border border-slate-800/80 p-3 text-xs font-mono text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-500/30 rounded-xl cursor-pointer appearance-none pr-10 focus:border-blue-500/40"
                >
                  {quarteis.map((q) => (
                    <option key={q.id} value={q.id} className="bg-slate-900 text-slate-200">
                      {q.nome.toUpperCase()} ({q.slug.toUpperCase() === 'CAVALARIA' ? 'RPMON' : q.slug.toUpperCase()})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Matrícula Funcional:</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Matrícula Funcional"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800/80 p-3 text-xs font-mono uppercase text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-500/30 rounded-xl placeholder:text-slate-600 focus:border-blue-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Senha de Acesso (PIN):</label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  required
                  placeholder="Senha cadastrada..."
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800/80 p-3 text-xs font-mono text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-500/30 rounded-xl placeholder:text-slate-600 focus:border-blue-500/40 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-955/30 border border-red-900/40 p-3 rounded-xl text-[10px] text-red-400 font-mono flex items-start gap-2.5"
              >
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
                <span>{authError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-3 rounded-xl text-xs transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer glow-blue disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Autenticando no SGBD...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 text-white" />
                  <span>Liberar Console de Armaria</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest block">
                PAIOL PRINCIPAL • CONEXÃO CRIPTOGRAFADA AES-256
              </span>
            </div>
          </form>
        )}

        {/* STEP 2: CADASTRO DE PRIMEIRO ACESSO */}
        {step === 'primeiro_acesso' && (
          <form onSubmit={handlePrimeiroAcessoSubmit} className="space-y-5 relative font-sans text-xs">
            <div className="bg-blue-955/30 border border-blue-900/40 p-3 rounded-xl space-y-1">
              <h4 className="text-[10px] font-mono font-bold text-blue-450 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-blue-400" />
                <span>Primeiro Acesso Detectado</span>
              </h4>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                Bem-vindo, <strong>{primeiroAcessoUser?.posto_graduacao} {primeiroAcessoUser?.nome_de_guerra || primeiroAcessoUser?.nome}</strong>. Cadastre a sua senha de acesso de 4 a 6 dígitos abaixo.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block font-sans">Nova Senha (PIN):</label>
              <input
                type="password"
                required
                maxLength={6}
                placeholder="Senha de 4 a 6 dígitos..."
                value={newSenha}
                onChange={(e) => setNewSenha(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950/70 border border-slate-800/80 p-3 text-xs font-mono text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-500/30 rounded-xl placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block font-sans">Confirmar Nova Senha:</label>
              <input
                type="password"
                required
                maxLength={6}
                placeholder="Confirme a nova senha..."
                value={confirmNewSenha}
                onChange={(e) => setConfirmNewSenha(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950/70 border border-slate-800/80 p-3 text-xs font-mono text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-500/30 rounded-xl placeholder:text-slate-600"
              />
            </div>

            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-955/30 border border-red-900/40 p-3 rounded-xl text-[10px] text-red-400 font-mono flex items-start gap-2.5"
              >
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
                <span>{authError}</span>
              </motion.div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setPrimeiroAcessoUser(null);
                  setNewSenha('');
                  setConfirmNewSenha('');
                  setAuthError('');
                }}
                className="w-1/3 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 text-slate-400 font-bold font-mono py-3 rounded-xl text-xs transition-all uppercase tracking-wider cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-3 rounded-xl text-xs transition-all shadow-md uppercase tracking-wider cursor-pointer glow-blue"
              >
                Cadastrar Senha
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCESSO E TRANSIÇÃO */}
        {step === 'sucesso' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-6 space-y-4 font-sans text-xs relative"
          >
            <div className="w-14 h-14 bg-emerald-600/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-405 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Acesso Autorizado</h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase mt-1">Carregando painel de comando do Paiol...</p>
            </div>
          </motion.div>
        )}

        {/* FOOTER DE ATUALIZAÇÃO DO SISTEMA */}
        <div className="border-t border-slate-850/60 mt-6 pt-4 flex flex-col items-center justify-center gap-2 text-[10px] font-mono text-slate-500 relative z-10">
          <div className="flex items-center gap-1.5">
            <span>Versão: <strong className="text-slate-400 font-bold">v{packageJson.version}</strong></span>
            <span className="text-slate-700">•</span>
            <span>Canal: <strong className="text-slate-400 font-bold">Homologação</strong></span>
          </div>

          <div className="flex items-center justify-center min-h-[16px]">
            {isDownloading ? (
              <span className="text-blue-450 font-bold flex items-center gap-1 animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
                Baixando atualização...
              </span>
            ) : updateAvailable ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="text-emerald-450 hover:text-emerald-400 font-bold underline cursor-pointer uppercase text-[9px] tracking-widest flex items-center gap-1 animate-pulse"
              >
                <Download className="h-3 w-3" />
                Instalar v{newVersion}
              </button>
            ) : isChecking ? (
              <span className="text-slate-400 flex items-center gap-1 animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Verificando...
              </span>
            ) : checkedSuccessfully ? (
              <span className="text-emerald-450 font-bold">Aplicativo atualizado!</span>
            ) : (
              <button
                type="button"
                onClick={handleCheckClick}
                className="text-slate-500 hover:text-slate-400 underline cursor-pointer font-bold uppercase text-[9px] tracking-wider flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Verificar Atualizações
              </button>
            )}
          </div>
          {updaterError && (
            <p className="text-red-400 text-[8px] font-mono mt-1 text-center max-w-[280px] truncate" title={updaterError}>
              Erro: {updaterError}
            </p>
          )}
        </div>

      </motion.div>
    </div>
  );
}
