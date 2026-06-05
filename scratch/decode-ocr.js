const line1 = "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDdBQzI3Mjc5MUQ0MDhCREIKUkVJSldUYmk0QWRlWExDZWkUZ2cHVxcFpYeUl5WFFnUUxid2p5ZlROaWpSQmpTUmtyTXAvcTNnbhGk";
const line2 = "d2p5ZlROaWpSQmpTUmtyTXAvcTNnbmhHaw==";
const fullB64 = line1 + line2;
try {
  const buf = Buffer.from(fullB64, 'base64');
  console.log("Success! Decoded length:", buf.length);
  const text = buf.toString('utf-8');
  console.log("Text content:\n", text);
  // Get second line of text content
  const lines = text.split('\n');
  console.log("Second line (Actual Public Key):", lines[1]);
} catch (e) {
  console.error("Failed:", e.message);
}
