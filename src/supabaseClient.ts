/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!envUrl || !envKey) {
  throw new Error('CONFIGURAÇÃO OBRIGATÓRIA FALTANTE: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos no arquivo .env.');
}

const CONFIGS = {
  homologacao: {
    url: envUrl,
    key: envKey
  },
  producao: {
    url: envUrl,
    key: envKey
  }
};

export type Ambiente = 'homologacao' | 'producao';

// Determinar o ambiente padrão - usamos homologacao como padrão único
// enquanto o banco de produção ainda está sendo configurado
// Obter o ambiente atual de forma dinâmica e automatizada
const isTauri = typeof window !== 'undefined' && (
  (window as any).__TAURI__ !== undefined ||
  (window as any).__TAURI_INTERNALS__ !== undefined
);
const isStagingMode = import.meta.env.MODE === 'staging';

// Se rodando no desktop (Tauri) ou em testes locais de staging, usa homologacao.
// Caso contrário (Vercel web), usa producao.
const ambienteAtual: Ambiente = (isTauri || isStagingMode) ? 'homologacao' : 'producao';
const config = CONFIGS[ambienteAtual];

let deviceUuid = '';

const isLocalDevOrStaging = import.meta.env.DEV || import.meta.env.MODE === 'staging';

if (!isTauri && isLocalDevOrStaging) {
  deviceUuid = 'DEVELOPMENT-TEST-DEVICE';
  console.warn(`[SUPABASE CLIENT] Modo de teste no navegador. Simulando device UUID autorizado: ${deviceUuid}`);
}

console.log(`[SUPABASE CLIENT] Inicializando em modo [${ambienteAtual.toUpperCase()}] usando a URL: ${config.url}`);

// Criar o cliente ativo
const activeClient = createClient(config.url, config.key, {
  global: {
    fetch: async (url, options) => {
      const headers: Record<string, string> = {};
      
      if (options?.headers) {
        if (options.headers instanceof Headers) {
          options.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else if (Array.isArray(options.headers)) {
          options.headers.forEach(([key, value]) => {
            headers[key] = value;
          });
        } else {
          Object.assign(headers, options.headers);
        }
      }
      
      if (deviceUuid) {
        headers['x-device-uuid'] = deviceUuid;
      }
      
      console.log(`[SUPABASE FETCH] URL: ${url}`);
      console.log(`[SUPABASE FETCH] Headers:`, {
        ...headers,
        Authorization: headers.Authorization ? 'Bearer [HIDDEN]' : 'undefined',
        apikey: headers.apikey ? '[PRESENT]' : 'undefined',
        'x-device-uuid': headers['x-device-uuid'] || 'undefined'
      });
      
      try {
        const response = await fetch(url, { ...options, headers });
        console.log(`[SUPABASE FETCH] URL: ${url} -> Status: ${response.status} ${response.statusText}`);
        
        if (response.status >= 400) {
          response.clone().text().then(body => {
            console.error(`[SUPABASE FETCH ERROR] URL: ${url} -> Body:`, body);
          }).catch(e => console.error('Erro ao ler corpo da resposta de erro:', e));
        }
        
        return response;
      } catch (err: any) {
        console.error(`[SUPABASE FETCH] URL: ${url} -> ERROR:`, err);
        throw err;
      }
    }
  }
});

// Proxy transparente para exportar o cliente dinâmico
export const supabase = new Proxy({}, {
  get(target, prop) {
    return (activeClient as any)[prop];
  }
}) as SupabaseClient;

export function obterAmbienteAtual(): Ambiente {
  return ambienteAtual;
}

export function alterarAmbiente(novoAmbiente: Ambiente) {
  localStorage.setItem('app_ambiente', novoAmbiente);
  window.location.reload();
}

/**
 * Injeta dinamicamente a assinatura física do dispositivo nos cabeçalhos das requisições
 * para que o Supabase aplique as políticas de segurança baseadas em hardware (RLS).
 */
export function configurarAssinaturaDispositivo(uuid: string) {
  deviceUuid = uuid;
  console.log(`SGBD: Assinatura de hardware configurada no ambiente [${ambienteAtual.toUpperCase()}]:`, uuid);
}
