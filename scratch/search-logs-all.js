import fs from 'fs';
import path from 'path';

const logFile = "C:\\Users\\wagne\\.gemini\\antigravity\\brain\\cfa10e11-d6aa-40d1-83d4-3c12c2f222c0\\.system_generated\\logs\\transcript.jsonl";

if (fs.existsSync(logFile)) {
  console.log("Log file found. Searching for signer outputs...");
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (!line) return;
    try {
      const parsed = JSON.parse(line);
      // Check if it contains the word "signer" or "public key" or the generated pubkey pattern
      const text = JSON.stringify(parsed);
      if (text.toLowerCase().includes('signer') || text.toLowerCase().includes('tauri-autoupdate')) {
        console.log(`Line ${i+1} (Step ${parsed.step_index}, Source ${parsed.source}, Type ${parsed.type}):`);
        // If content is present and is a string, check if it has the keys
        if (parsed.content) {
          console.log(parsed.content.substring(0, 800));
        }
        if (parsed.tool_calls) {
          console.log("Tool calls:", JSON.stringify(parsed.tool_calls, null, 2));
        }
        console.log('----------------------------------------------------');
      }
    } catch (e) {
      // Ignore parse errors
    }
  });
} else {
  console.log("Log file not found.");
}
