import fs from 'fs';
import path from 'path';

const brainDir = "C:\\Users\\wagne\\.gemini\\antigravity\\brain\\cfa10e11-d6aa-40d1-83d4-3c12c2f222c0";

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== '.system_generated') {
        search(fullPath);
      }
    } else if (file.endsWith('.md') || file.endsWith('.json')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('pubkey') || content.includes('dW50cnVzdGVK') || content.includes('RWTbi4')) {
        console.log(`Found in file: ${file}`);
        // Find matching lines
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes('pubkey') || line.includes('dW50cnVzdGVK') || line.includes('RWTbi4')) {
            console.log(`  Line ${i+1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

search(brainDir);
