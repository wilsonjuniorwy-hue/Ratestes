const b64 = "UldUbi4AdeXLCeiggHwXpYeIyXQgQLbwjyfTNijRBjSRkrMp/q3gnhGkd2p5ZlROaWpSQmpTUmtyTXAvcTNnbmhHaw==";
const decoded = Buffer.from(b64, 'base64').toString('latin1');
console.log("Decoded string (latin1):", decoded);
