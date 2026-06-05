import fs from 'fs';
import path from 'path';

const logFile = "C:\\Users\\wagne\\.gemini\\antigravity\\brain\\cfa10e11-d6aa-40d1-83d4-3c12c2f222c0\\.system_generated\\logs\\transcript.jsonl";

if (fs.existsSync(logFile)) {
  console.log("Log file found. Extracting steps 470 to 485...");
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (!line) return;
    try {
      const parsed = JSON.parse(line);
      if (parsed.step_index >= 470 && parsed.step_index <= 485) {
        console.log(`Line ${i+1} (Step ${parsed.step_index}, Source: ${parsed.source}, Type: ${parsed.type}):`);
        if (parsed.content) {
          console.log(parsed.content);
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
