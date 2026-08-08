/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Gera o hash SHA-256 de uma string de forma assíncrona.
 * Retorna uma string vazia se a entrada for vazia.
 */
export async function hashSHA256(message: string): Promise<string> {
  if (!message) return '';
  
  // Se já for um hash SHA-256 (64 caracteres hexadecimais), não reagrupa
  if (/^[a-f0-9]{64}$/i.test(message)) {
    return message.toLowerCase();
  }

  // Verificar suporte ao Web Crypto API em contextos não-seguros (ex: HTTP por IP de rede)
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    const isTauriEnv = typeof window !== 'undefined' && ((window as any).__TAURI_INTERNALS__ !== undefined || (window as any).__TAURI__ !== undefined);
    if (!isTauriEnv && typeof window !== 'undefined' && !window.isSecureContext) {
      throw new Error('Acesso via HTTP não seguro detectado. Para efetuar login, utilize HTTPS ou o aplicativo Desktop oficial.');
    }
    throw new Error('Web Crypto API (crypto.subtle) não é suportado neste navegador.');
  }

  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compara uma senha em texto claro (ou já hashed) com um hash conhecido.
 * Suporta fallback caso o hash conhecido seja texto plano (migração legada).
 */
export async function comparePassword(input: string, storedHash: string): Promise<{ matches: boolean; needsMigration: boolean }> {
  if (!storedHash || storedHash.trim() === '') {
    return { matches: false, needsMigration: false };
  }

  const isStoredHashed = /^[a-f0-9]{64}$/i.test(storedHash);
  const inputHash = await hashSHA256(input);

  if (isStoredHashed) {
    return { 
      matches: inputHash === storedHash.toLowerCase(), 
      needsMigration: false 
    };
  } else {
    // Legado: armazenado em texto claro
    const matches = input === storedHash;
    return { 
      matches, 
      needsMigration: matches 
    };
  }
}
