/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, Shield, Search, CheckCircle, AlertOctagon, 
  Clock, ArrowRight, ShieldAlert, KeyRound, 
  Layers, Package, ChevronRight, LayoutDashboard, History, FileCheck2, Power, AlertTriangle, Terminal,
  UserPlus, ClipboardList, Printer, Database, Download, Upload
} from 'lucide-react';
import { Usuario, Cautela, OcorrenciaRelatorio } from '../types';

import { useSupabaseDatabase } from '../hooks/useSupabaseDatabase';
import ErrorBoundary from './ErrorBoundary';
import { TotemView } from './TotemView';
import { ArmeiroView } from './ArmeiroView';
import { BancoDadosView } from './BancoDadosView';
import { OcorrenciasView } from './OcorrenciasView';
import { ArmeiroProfileView } from './ArmeiroProfileView';

interface FlowSimulatorProps {
  db: ReturnType<typeof useSupabaseDatabase>;
  activeArmeiroMatricula: string;
  setActiveArmeiroMatricula: (matricula: string) => void;
}

export default function FlowSimulator({
  db,
  activeArmeiroMatricula,
  setActiveArmeiroMatricula
}: FlowSimulatorProps) {
  // ---- CONTROLE DE FLUXO/VISÃO ----
  const [roleMode, setRoleMode] = useState<'policial' | 'armeiro' | 'banco_dados' | 'livro_ocorrencias' | 'config_armeiro'>('policial');

  // Forçar o modo Totem de autoatendimento se o armeiro logado for o usuário 'ARMEIRO'
  React.useEffect(() => {
    if (activeArmeiroMatricula?.toUpperCase() === 'ARMEIRO') {
      setRoleMode('policial');
    }
  }, [activeArmeiroMatricula]);

  // ---- FLUXO POLICIAL: ESTADOS LOCAIS ----
  const [policialStep, setPolicialStep] = useState<'login' | 'cadastro_senha' | 'aptidao' | 'carrinho' | 'assinatura' | 'sucesso'>('login');
  const [matriculaInput, setMatriculaInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [loggedUser, setLoggedUser] = useState<Usuario | null>(null);
  const [novaSenhaInput, setNovaSenhaInput] = useState('');
  const [confirmarSenhaInput, setConfirmarSenhaInput] = useState('');
  const [cadastroSenhaError, setCadastroSenhaError] = useState('');
  const [cartItens, setCartItens] = useState<string[]>([]); // Array com ids_materiais
  const [observacoesRetirada, setObservacoesRetirada] = useState('Escala operacional de serviço de radiopatrulha tática.');
  const [generatedCautela, setGeneratedCautela] = useState<Cautela | null>(null);
  const [authError, setAuthError] = useState('');

  // Estados para Impressão de Relatórios
  const [printMode, setPrintMode] = useState<'cautelas' | 'logs' | 'ocorrencia' | null>(null);
  const [printLogDate, setPrintLogDate] = useState('');
  const [selectedOcorrenciaPrint, setSelectedOcorrenciaPrint] = useState<OcorrenciaRelatorio | null>(null);

  // ---- IMPRESSÃO DE RELATÓRIOS ----
  const handlePrintCautelas = () => {
    setPrintMode('cautelas');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintLogs = () => {
    setPrintMode('logs');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintOcorrencia = (oco: OcorrenciaRelatorio) => {
    setSelectedOcorrenciaPrint(oco);
    setPrintMode('ocorrencia');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportBackup = () => {
    try {
      const dataStr = JSON.stringify({
        usuarios: db.usuarios,
        categorias: db.categorias,
        modelos_armas: db.modelosArmas,
        materiais: db.materiais,
        cautelas: db.cautelas,
        cautela_itens: db.cautelaItens,
        armas_particulares: db.armasParticulares,
        pendencias_servico: db.pendenciasServico,
        ocorrencias: db.ocorrencias,
        auditoria_logs: db.auditoriaLogs,
      }, null, 2);

      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const tempAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      tempAnchor.href = url;
      tempAnchor.download = `backup_reserva_armamento_${dateStr}.json`;
      document.body.appendChild(tempAnchor);
      tempAnchor.click();
      document.body.removeChild(tempAnchor);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Erro ao gerar arquivo de backup: ' + error.message);
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('ALERTA CRÍTICO: A restauração de backup apagará permanentemente todos os dados atuais do Supabase e os substituirá pelo arquivo selecionado. Deseja continuar?')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Falha na leitura do arquivo.');
        }

        const data = JSON.parse(text);
        
        await db.importarBackupDatabase(data);
        
        // Resetar estados locais após sucesso na restauração
        setLoggedUser(null);
        setMatriculaInput('');
        setSenhaInput('');
        setCartItens([]);
        setPolicialStep('login');
        
        alert('Banco de dados restaurado e sincronizado com sucesso!');
      } catch (error: any) {
        alert('Erro ao processar arquivo de backup: ' + error.message);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6" id="flow-simulator-root">
      
      {/* Barra de Seleção de Papel do Fluxo */}
      {activeArmeiroMatricula?.toUpperCase() !== 'ARMEIRO' && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg" id="role-selector-bar">
          <div className="flex items-center gap-3.5">
            <span className="text-[10px] font-bold text-slate-450 font-mono uppercase tracking-wider">MODO DO SIMULADOR:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-slate-950/80 p-1 border border-slate-855 rounded-lg" id="role-buttons-wrapper">
              <button
                id="btn-mode-policial"
                onClick={() => setRoleMode('policial')}
                className={`px-4 py-2.5 rounded border text-xs font-bold font-mono flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                  roleMode === 'policial'
                    ? 'bg-blue-600/10 text-white border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                    : 'border-transparent text-slate-400 hover:text-slate-205 hover:bg-slate-900/50'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${roleMode === 'policial' ? 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-slate-600'}`}></div>
                <span>Totem Autoatendimento (Policial)</span>
              </button>
              
              <button
                id="btn-mode-armeiro"
                onClick={() => setRoleMode('armeiro')}
                className={`px-4 py-2.5 rounded border text-xs font-bold font-mono flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                  roleMode === 'armeiro'
                    ? 'bg-blue-600/10 text-white border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                    : 'border-transparent text-slate-400 hover:text-slate-205 hover:bg-slate-900/50'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${roleMode === 'armeiro' ? 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-slate-600'}`}></div>
                <span>Console da Armaria (Armeiro)</span>
              </button>

              <button
                id="btn-mode-banco-dados"
                onClick={() => setRoleMode('banco_dados')}
                className={`px-4 py-2.5 rounded border text-xs font-bold font-mono flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                  roleMode === 'banco_dados'
                    ? 'bg-blue-600/10 text-white border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                    : 'border-transparent text-slate-400 hover:text-slate-205 hover:bg-slate-900/50'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${roleMode === 'banco_dados' ? 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-slate-600'}`}></div>
                <span>Banco de Dados</span>
              </button>

              <button
                id="btn-mode-ocorrencias"
                onClick={() => setRoleMode('livro_ocorrencias')}
                className={`px-4 py-2.5 rounded border text-xs font-bold font-mono flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                  roleMode === 'livro_ocorrencias'
                    ? 'bg-blue-600/10 text-white border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                    : 'border-transparent text-slate-400 hover:text-slate-205 hover:bg-slate-900/50'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${roleMode === 'livro_ocorrencias' ? 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-slate-600'}`}></div>
                <span>Livro de Ocorrências</span>
              </button>

              <button
                id="btn-mode-config-armeiro"
                onClick={() => setRoleMode('config_armeiro')}
                className={`px-4 py-2.5 rounded border text-xs font-bold font-mono flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                  roleMode === 'config_armeiro'
                    ? 'bg-blue-600/10 text-white border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                    : 'border-transparent text-slate-400 hover:text-slate-205 hover:bg-slate-900/50'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${roleMode === 'config_armeiro' ? 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-slate-600'}`}></div>
                <span>Armeiro</span>
              </button>
            </div>
          </div>

          {activeArmeiroMatricula === '7317573' && (
            <div className="flex items-center gap-2.5" id="admin-backup-controls">
              <button
                id="btn-export-backup"
                onClick={handleExportBackup}
                className="text-xs font-mono text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20 px-4 py-2.5 rounded-lg border border-emerald-900/40 font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2"
                title="Fazer backup completo das tabelas em arquivo JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup do Sistema</span>
              </button>
              
              <button
                id="btn-import-backup-trigger"
                onClick={() => document.getElementById('import-backup-file')?.click()}
                className="text-xs font-mono text-blue-405 hover:text-blue-350 hover:bg-blue-955/40 px-4 py-2.5 rounded-lg border border-blue-800/50 font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2"
                title="Restaurar banco de dados a partir de arquivo de backup JSON"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar Backup</span>
              </button>
              
              <input
                type="file"
                id="import-backup-file"
                className="hidden"
                accept=".json"
                onChange={handleImportBackup}
              />
            </div>
          )}
        </div>
      )}

      {/* RENDERIZAÇÃO DOS DIFERENTES PAINÉIS COM PROTEÇÃO DE ERRO LOCAL */}
      
      {roleMode === 'policial' && (
        <ErrorBoundary>
          <TotemView
            usuarios={db.usuarios}
            materiais={db.materiais}
            cautelas={db.cautelas}
            cautelaItens={db.cautelaItens}
            policialStep={policialStep}
            setPolicialStep={setPolicialStep}
            matriculaInput={matriculaInput}
            setMatriculaInput={setMatriculaInput}
            senhaInput={senhaInput}
            setSenhaInput={setSenhaInput}
            loggedUser={loggedUser}
            setLoggedUser={setLoggedUser}
            novaSenhaInput={novaSenhaInput}
            setNovaSenhaInput={setNovaSenhaInput}
            confirmarSenhaInput={confirmarSenhaInput}
            setConfirmarSenhaInput={setConfirmarSenhaInput}
            cadastroSenhaError={cadastroSenhaError}
            setCadastroSenhaError={setCadastroSenhaError}
            cartItens={cartItens}
            setCartItens={setCartItens}
            observacoesRetirada={observacoesRetirada}
            setObservacoesRetirada={setObservacoesRetirada}
            generatedCautela={generatedCautela}
            setGeneratedCautela={setGeneratedCautela}
            authError={authError}
            setAuthError={setAuthError}
            registrarLogAuditoria={db.registrarLogAuditoria}
            cadastrarSenha={db.cadastrarSenha}
            processEfetivarCautela={db.processEfetivarCautela}
          />
        </ErrorBoundary>
      )}

      {roleMode === 'armeiro' && (
        <ErrorBoundary>
          <ArmeiroView
            usuarios={db.usuarios}
            materiais={db.materiais}
            cautelas={db.cautelas}
            cautelaItens={db.cautelaItens}
            auditoriaLogs={db.auditoriaLogs}
            cadastrarPolicial={db.cadastrarPolicial}
            processDevolucao={db.processDevolucao}
            handlePrintCautelas={handlePrintCautelas}
            handlePrintLogs={handlePrintLogs}
            printLogDate={printLogDate}
            setPrintLogDate={setPrintLogDate}
            activeArmeiroMatricula={activeArmeiroMatricula}
            excluirCautelaTotal={db.excluirCautelaTotal}
          />
        </ErrorBoundary>
      )}

      {roleMode === 'banco_dados' && (
        <ErrorBoundary>
          <BancoDadosView
            usuarios={db.usuarios}
            materiais={db.materiais}
            categorias={db.categorias}
            adicionarCategoria={db.adicionarCategoria}
            cautelas={db.cautelas}
            cautelaItens={db.cautelaItens}
            zerarSenha={db.zerarSenha}
            updatePorte={db.updatePorte}
            adicionarMaterial={db.adicionarMaterial}
            updateMaterialStatus={db.updateMaterialStatus}
            confirmarRetirada={db.confirmarRetirada}
            modelosArmas={db.modelosArmas}
            adicionarModeloArma={db.adicionarModeloArma}
            activeArmeiroMatricula={activeArmeiroMatricula}
            excluirPolicialTotal={db.excluirPolicialTotal}
            excluirMaterialTotal={db.excluirMaterialTotal}
            armasParticulares={db.armasParticulares}
            adicionarArmaParticular={db.adicionarArmaParticular}
            devolverArmasParticulares={db.devolverArmasParticulares}
          />
        </ErrorBoundary>
      )}

      {roleMode === 'livro_ocorrencias' && (
        <ErrorBoundary>
          <OcorrenciasView
            ocorrencias={db.ocorrencias}
            materiais={db.materiais}
            salvarOcorrencia={db.salvarOcorrencia}
            handlePrintOcorrencia={handlePrintOcorrencia}
            activeArmeiroMatricula={activeArmeiroMatricula}
            pendenciasServico={db.pendenciasServico}
            adicionarPendencia={db.adicionarPendencia}
            resolverPendencia={db.resolverPendencia}
          />
        </ErrorBoundary>
      )}

      {roleMode === 'config_armeiro' && (
        <ErrorBoundary>
          <ArmeiroProfileView
            usuarios={db.usuarios}
            activeArmeiroMatricula={activeArmeiroMatricula}
            setActiveArmeiroMatricula={setActiveArmeiroMatricula}
            alterarSenhaArmeiro={db.alterarSenhaArmeiro}
            cadastrarPolicial={db.cadastrarPolicial}
            editarPolicial={db.editarPolicial}
            excluirUsuario={db.excluirUsuario}
          />
        </ErrorBoundary>
      )}

      {/* ESTILO DE IMPRESSÃO DINÂMICO COMPACTO */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif !important;
            font-size: 10pt !important;
          }
          #app-header, 
          footer, 
          #role-selector-bar, 
          #policial-journey-wrapper, 
          #armeiro-panel-root,
          #arm-banco-dados-view,
          #arm-ocorrencias-view,
          #arm-perfil-view-root,
          button, 
          select, 
          input, 
          .no-print {
            display: none !important;
          }
          #app-root, 
          #app-main-content, 
          #flow-simulator-root {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            display: block !important;
          }
          #print-area-cautelas {
            display: ${printMode === 'cautelas' ? 'block' : 'none'} !important;
          }
          #print-area-logs {
            display: ${printMode === 'logs' ? 'block' : 'none'} !important;
          }
          #print-area-ocorrencia {
            display: ${printMode === 'ocorrencia' ? 'block' : 'none'} !important;
          }
          #print-area-cautelas, #print-area-logs, #print-area-ocorrencia {
            width: 100% !important;
            margin: 0 !important;
            padding: 15px !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 15px !important;
            margin-bottom: 15px !important;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 6px 8px !important;
            text-align: left !important;
            font-size: 8pt !important;
            color: #000 !important;
            line-height: 1.2 !important;
          }
          th {
            background-color: #f2f2f2 !important;
            font-weight: bold !important;
          }
          h2 {
            font-size: 13pt !important;
            margin-bottom: 5px !important;
            text-transform: uppercase !important;
            text-align: center !important;
            border-bottom: 2px solid #000 !important;
            padding-bottom: 5px !important;
            font-weight: bold !important;
          }
          .print-meta {
            margin-bottom: 15px !important;
            font-size: 8pt !important;
            text-align: center !important;
            color: #333 !important;
            font-style: italic !important;
          }
        }
        @media screen {
          #print-area-cautelas, #print-area-logs, #print-area-ocorrencia {
            display: none !important;
          }
        }
      `}} />

      {/* ÁREA DE IMPRESSÃO - CAUTELAS */}
      <div id="print-area-cautelas">
        <h2>Relatório Geral de Cautelas - PMDF</h2>
        <div className="print-meta">
          Gerado em: {new Date().toLocaleString()}
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: '12%' }}>Código Guia</th>
              <th style={{ width: '25%' }}>Policial</th>
              <th style={{ width: '28%' }}>Itens Cautelados</th>
              <th style={{ width: '15%' }}>Retirada</th>
              <th style={{ width: '15%' }}>Devolução</th>
              <th style={{ width: '10%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {db.cautelas.map(c => {
              const pol = db.usuarios.find(u => u.matricula === c.matricula_policial);
              const cItens = db.cautelaItens.filter(ci => ci.id_cautela === c.id_cautela);
              return (
                <tr key={c.id_cautela}>
                  <td>{c.id_cautela}</td>
                  <td>
                    {pol?.posto_graduacao} {pol?.nome} ({c.matricula_policial})
                    {pol?.nome_de_guerra ? ` [Guerra: ${pol.nome_de_guerra}]` : ''}
                  </td>
                  <td>
                    {cItens.map(ci => {
                      const matItem = db.materiais.find(m => m.id_material === ci.id_material);
                      return `${matItem?.modelo} (S/N: ${ci.id_material})`;
                    }).join(', ')}
                  </td>
                  <td>
                    {new Date(c.data_retirada).toLocaleDateString()} {new Date(c.data_retirada).toLocaleTimeString()}
                    <br />Armeiro: {c.matricula_armeiro_retirada}
                  </td>
                  <td>
                    {c.data_devolucao_efetiva ? (
                      <>
                        {new Date(c.data_devolucao_efetiva).toLocaleDateString()} {new Date(c.data_devolucao_efetiva).toLocaleTimeString()}
                        <br />Armeiro: {c.matricula_armeiro_devolucao}
                      </>
                    ) : (
                      'Em aberto'
                    )}
                  </td>
                  <td>{c.status_cautela.toUpperCase()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ÁREA DE IMPRESSÃO - LOGS */}
      <div id="print-area-logs">
        <h2>Trilha de Auditoria Forense - PMDF</h2>
        <div className="print-meta">
          Gerado em: {new Date().toLocaleString()} | Filtro de Data: {printLogDate ? new Date(printLogDate + 'T00:00:00').toLocaleDateString() : 'Todos os registros'}
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Data/Hora</th>
              <th style={{ width: '15%' }}>Evento</th>
              <th style={{ width: '15%' }}>Executor</th>
              <th style={{ width: '45%' }}>Detalhes do Evento</th>
              <th style={{ width: '10%' }}>ID Log</th>
            </tr>
          </thead>
          <tbody>
            {db.auditoriaLogs
              .filter(log => {
                if (printLogDate) {
                  const dateVal = new Date(log.data_hora).toISOString().split('T')[0];
                  return dateVal === printLogDate;
                }
                return true;
              })
              .map(log => (
                <tr key={log.id_log}>
                  <td>{new Date(log.data_hora).toLocaleDateString()} {new Date(log.data_hora).toLocaleTimeString()}</td>
                  <td>{log.tipo_evento.toUpperCase().replace('_', ' ')}</td>
                   <td>
                    {(() => {
                      const exec = db.usuarios.find(u => u.matricula === log.matricula_executor);
                      return exec ? `${exec.posto_graduacao} ${exec.nome_de_guerra || exec.nome} (${log.matricula_executor})` : log.matricula_executor;
                    })()}
                  </td>
                  <td>{log.detalhes}</td>
                  <td>{log.id_log}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ÁREA DE IMPRESSÃO - OCORRÊNCIA INDIVIDUAL */}
      {selectedOcorrenciaPrint && (
        <div id="print-area-ocorrencia" style={{ fontFamily: 'Arial, sans-serif' }}>
          <h2 style={{ textAlign: 'center', textTransform: 'uppercase', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '20px' }}>
            Termo de Registro de Ocorrência Bélica - PMDF
          </h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '25%' }}>Código Registro:</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '25%' }}>{selectedOcorrenciaPrint.id_ocorrencia}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', width: '25%' }}>Data/Hora Registro:</td>
                <td style={{ border: '1px solid #000', padding: '8px', width: '25%' }}>
                  {new Date(selectedOcorrenciaPrint.data_hora).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Tipo de Ocorrência:</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {selectedOcorrenciaPrint.tipo.toUpperCase().replace('_', ' ')}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Armeiro Relator:</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{selectedOcorrenciaPrint.matricula_armeiro}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Assunto / Título:</td>
                <td colSpan={3} style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
                  {selectedOcorrenciaPrint.titulo.toUpperCase()}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ border: '1px solid #000', padding: '15px', minHeight: '200px', fontSize: '10pt', lineHeight: '1.6', marginBottom: '40px', whiteSpace: 'pre-wrap' }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px', textTransform: 'uppercase', fontSize: '9pt' }}>
              Descrição dos Fatos:
            </div>
            {selectedOcorrenciaPrint.descricao}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '60px' }}>
            <div style={{ textAlign: 'center', width: '40%' }}>
              <div style={{ borderTop: '1.5px solid #000', paddingTop: '5px', fontSize: '9pt' }}>
                Assinatura do Armeiro Relator
                <br />
                <span style={{ fontSize: '8pt', color: '#555' }}>Matrícula: {selectedOcorrenciaPrint.matricula_armeiro}</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', width: '40%' }}>
              <div style={{ borderTop: '1.5px solid #000', paddingTop: '5px', fontSize: '9pt' }}>
                Visto do Comandante do Policiamento / Guarda
                <br />
                <span style={{ fontSize: '8pt', color: '#555' }}>Matrícula: ______________</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
