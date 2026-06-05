const line1 = "untrusted comment: minisign public key: 7AC272791D808BDB";
const line2 = "RWTbi4AdeXLCeiggHwXpYeIyXQgQLbwjyfTNijRBjSRkrMp/q3gnhGk";
const fileContent = line1 + "\n" + line2;
const b64 = Buffer.from(fileContent).toString('base64');
console.log("Expected Base64:\n", b64);
