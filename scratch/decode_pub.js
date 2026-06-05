const b64 = "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXkgMTBmMmYyYyBrZXk6IDdBQzI3Mjc5MUQ4MDhCREIKUldUYmk0QWRlWExDZWlnZ0h3WHBZZUl5WFFnUUxid2p5ZlROaWpSQmpTUmtyTXAvcTNnbmhHaw==";
const decoded = Buffer.from(b64, 'base64').toString('utf8');

console.log("--- DECODED FILE CONTENT ---");
console.log(decoded);
console.log("----------------------------");

const lines = decoded.split(/\r?\n/);
console.log(`Number of lines: ${lines.length}`);
lines.forEach((line, i) => {
  console.log(`Line ${i + 1} length: ${line.length}`);
  console.log(`Line ${i + 1} content: "${line}"`);
  
  if (i === 1) {
    // Try to decode the public key line from base64
    try {
      const keyBytes = Buffer.from(line, 'base64');
      console.log(`  Decoded key bytes length: ${keyBytes.length}`);
      console.log(`  Decoded key bytes (hex): ${keyBytes.toString('hex')}`);
    } catch (e) {
      console.log(`  Failed to decode line 2 as base64: ${e.message}`);
    }
  }
});
