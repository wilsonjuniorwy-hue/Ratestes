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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
