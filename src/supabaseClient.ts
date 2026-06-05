/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const CONFIGS = {
  homologacao: {
    url: "https://rndyzoyhpmubbbuxtuso.supabase.co",
    key: "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7"
  },
  producao: {
    url: import.meta.env.VITE_SUPABASE_URL || "https://rwnldjtevkheiwutxhgg.supabase.co",
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_CQWOt6VSUTH7jPdYJXiY2w_IjvhG1Ea"
  }
};

export type Ambiente = 'homologacao' | 'producao';

// Determinar o ambiente padrão - usamos homologacao como padrão único
// enquanto o banco de produção ainda está sendo configurado
const ambientePadrao: Ambiente = 'homologacao';

// Obter o ambiente atual (salvo no localStorage ou usar o padrão)
const ambienteAtual: Ambiente = (localStorage.getItem('app_ambiente') as Ambiente) || ambientePadrao;
const config = CONFIGS[ambienteAtual];

let deviceUuid = '';

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
