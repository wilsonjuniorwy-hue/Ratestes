import fs from 'fs';
import path from 'path';

const logFile = "C:\\Users\\wagne\\.gemini\\antigravity\\brain\\cfa10e11-d6aa-40d1-83d4-3c12c2f222c0\\.system_generated\\logs\\transcript.jsonl";

if (fs.existsSync(logFile)) {
  console.log("Log file found. Searching...");
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  let matchCount = 0;
  lines.forEach((line, i) => {
    if (line.includes('pubkey') || line.includes('updater') || line.includes('tauri-autoupdate') || line.includes('untrusted comment')) {
      matchCount++;
      console.log(`Line ${i+1}:`);
      // Print a snippet of the JSON line (truncated if too long)
      console.log(line.length > 500 ? line.substring(0, 500) + '...' : line);
      console.log('---');
    }
  });
  console.log(`Total matches: ${matchCount}`);
} else {
  console.log("Log file not found at " + logFile);
}
