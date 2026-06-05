import fs from 'fs';

const origB64 = "dW50cnVzdGVKIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDdBQzI3Mjc5MUQ4MDhCREIKUldUYmk0QWRlWExDZWkUZ2cHVxcFpYeUl5WFFnUUxid2p5ZlROaWpSQmpTUmtyTXAvcTNnbhGk";
const buf = Buffer.from(origB64, 'base64');
console.log("Decoded length:", buf.length);
console.log("Decoded text:");
console.log(buf.toString('utf-8'));
console.log("\nHex representation of decoded bytes:");
console.log(buf.toString('hex'));
