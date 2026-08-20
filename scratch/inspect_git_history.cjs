const { execSync } = require('child_process');

const commits = ['6891237', '516fac7', 'da2f16c', '4ddce62', 'b3b2a79'];

for (const c of commits) {
  console.log(`\n=================== COMMIT ${c} ===================`);
  try {
    const code = execSync(`git show ${c}:src/hooks/useSupabaseDatabase.ts`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const lines = code.split('\n');
    const idx = lines.findIndex(l => l.includes('const processDevolucao'));
    if (idx !== -1) {
      console.log(lines.slice(idx, idx + 60).join('\n'));
    }
  } catch (e) {
    console.error(e.message);
  }
}
