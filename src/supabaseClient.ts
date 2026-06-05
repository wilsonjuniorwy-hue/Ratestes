/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('seu-projeto') || supabaseAnonKey.includes('sua_chave')) {
  console.warn(
    'AVISO: Credenciais do Supabase não configuradas no arquivo .env. ' +
    'Por favor, edite o arquivo .env na raiz do projeto com as chaves corretas do seu painel Supabase.'
  );
}

let deviceUuid = '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => {
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
      
      return fetch(url, { ...options, headers });
    }
  }
});

/**
 * Injeta dinamicamente a assinatura física do dispositivo nos cabeçalhos das requisições
 * para que o Supabase aplique as políticas de segurança baseadas em hardware (RLS).
 */
export function configurarAssinaturaDispositivo(uuid: string) {
  deviceUuid = uuid;
  console.log('SGBD: Assinatura de hardware configurada para as requisições:', uuid);
}

