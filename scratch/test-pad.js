const key = "RWTbi4AdeXLCeiggHwXpYeIyXQgQLbwjyfTNijRBjSRkrMp/q3gnhGk=";
try {
  const buf = Buffer.from(key, 'base64');
  console.log("Success! Decoded length:", buf.length);
  console.log("Hex:", buf.toString('hex'));
} catch (e) {
  console.error("Failed:", e.message);
}
