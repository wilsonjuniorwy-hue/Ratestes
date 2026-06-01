import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-slate-900/80 backdrop-blur-md border-2 border-red-900/60 rounded-xl p-8 shadow-2xl max-w-xl mx-auto my-12 text-center space-y-6 font-sans">
          <div className="mx-auto w-16 h-16 bg-red-950/40 border border-red-500/40 rounded-full flex items-center justify-center text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-black font-mono text-red-400 uppercase tracking-wide">
              Anomalia no Módulo Bélico
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ocorreu uma falha inesperada na renderização ou processamento deste painel. O isolamento de segurança preveniu a queda total do sistema.
            </p>
          </div>

          {this.state.error && (
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg text-left font-mono text-[10px] text-red-450/80 overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
              <strong>Código do Erro:</strong> {this.state.error.message}
            </div>
          )}

          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold font-mono py-2.5 px-6 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider cursor-pointer"
          >
            <RefreshCw className="h-4.5 w-4.5 shrink-0" />
            <span>Recarregar Módulo</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
