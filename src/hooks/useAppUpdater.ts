import { useState, useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { invoke } from '@tauri-apps/api/core';

export function useAppUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<any>(null);

  const checkUpdates = async (manual = false) => {
    // Apenas executar se estiver dentro do Tauri
    const isTauri = typeof window !== 'undefined' && (
      (window as any).__TAURI__ !== undefined ||
      (window as any).__TAURI_INTERNALS__ !== undefined
    );
    if (!isTauri) {
      if (manual) alert("O atualizador automático só funciona no aplicativo desktop nativo.");
      return null;
    }

    try {
      setError(null);
      console.log("Buscando atualizações...");
      const update = await check();
      if (update) {
        console.log(`Nova versão disponível: ${update.version}`);
        setUpdateAvailable(true);
        setNewVersion(update.version);
        setPendingUpdate(update);
        return update;
      } else {
        console.log("O aplicativo já está na versão mais recente.");
        if (manual) {
          alert("O aplicativo já está na versão mais recente!");
        }
      }
    } catch (err: any) {
      console.error("Erro ao checar atualizações:", err);
      if (manual) {
        setError(err.message || "Erro ao conectar com servidor de atualizações.");
      }
    }
    return null;
  };

  const installUpdate = async () => {
    if (!pendingUpdate) return;
    try {
      setIsDownloading(true);
      setProgress(0);
      
      console.log('Baixando e instalando atualização...');
      
      // Baixa e instala a atualização
      await pendingUpdate.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            console.log('Download da atualização iniciado.');
            break;
          case 'Progress':
            const downloaded = event.data.chunkLength;
            console.log(`Baixado: ${downloaded} bytes`);
            break;
          case 'Finished':
            console.log('Download concluído.');
            break;
        }
      });
      
      setIsDownloading(false);
      
      // Reinicia o aplicativo para aplicar a nova versão
      if (confirm("Atualização instalada com sucesso! Deseja reiniciar o aplicativo agora para aplicar as alterações?")) {
        await invoke('reiniciar_aplicacao');
      }
    } catch (err: any) {
      console.error("Erro ao instalar atualização:", err);
      setIsDownloading(false);
      setError(err.message || "Falha ao instalar atualização.");
    }
  };

  // Checar automaticamente ao iniciar
  useEffect(() => {
    const isTauri = typeof window !== 'undefined' && (
      (window as any).__TAURI__ !== undefined ||
      (window as any).__TAURI_INTERNALS__ !== undefined
    );
    if (isTauri) {
      // Pequeno atraso para dar tempo das conexões de rede estabilizarem
      const timer = setTimeout(() => {
        checkUpdates(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  return {
    updateAvailable,
    newVersion,
    isDownloading,
    progress,
    error,
    checkUpdates,
    installUpdate
  };
}
