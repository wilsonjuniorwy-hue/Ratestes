// Separar pelas partes que o OCR juntou com $ (que era uma quebra de linha)
const rawText = "untrusted comment: minisign public key: 7AC272791D808BDB$RWTbi4AdKXLCei3PvvpuqceipZXyIyXQgQLbwjyfTNijRBjSRkrMp/q3glx";

// O $ é a quebra de linha misturada pelo OCR
const parts = rawText.split('$');
console.log(`Partes encontradas: ${parts.length}`);
parts.forEach((part, i) => {
  console.log(`\nParte ${i + 1} (${part.length} chars): "${part}"`);
});

// A chave pública é a segunda parte
const pubkey = parts[1];
console.log("\n=== CHAVE PUBLICA EXTRAIDA ===");
console.log(pubkey);
console.log(`Comprimento: ${pubkey.length} chars`);
console.log(`chars % 4 = ${pubkey.length % 4} (precisa ser 0 para base64 valido sem padding)`);

// Gerar o base64 completo do arquivo para colocar no tauri.conf.json
const fileContent = parts[0] + "\n" + pubkey + "\n";
const base64ForConfig = Buffer.from(fileContent).toString('base64');
console.log("\n=== BASE64 PARA COLOCAR NO tauri.conf.json ===");
console.log(base64ForConfig);
