const b64 = "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXkgMTBmMmYyYyBrZXk6IDdBQzI3Mjc5MUQ4MDhCREIKUldUbi4AdeXLCeiggHwXpYeIyXQgQLbwjyfTNijRBjSRkrMp/q3gnhGkd2p5ZlROaWpSQmpTUmtyTXAvcTNnbmhHaw==";
const decoded = Buffer.from(b64, 'base64').toString('utf8');

console.log("--- DECODED REAL CONTENT ---");
console.log(decoded);
console.log("----------------------------");

const lines = decoded.split(/\r?\n/);
lines.forEach((line, i) => {
  console.log(`Line ${i + 1} length: ${line.length}`);
  console.log(`Line ${i + 1} content: "${line}"`);
});
