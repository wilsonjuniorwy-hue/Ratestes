const { execSync } = require('child_process');
const path = require('path');

const gitExec = 'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\cmd\\git.exe';
const cwd = path.join(__dirname, '..');

function runGit(args) {
  const cmd = `"${gitExec}" ${args}`;
  console.log('Running:', cmd);
  try {
    const stdout = execSync(cmd, { cwd, encoding: 'utf8' });
    console.log(stdout);
  } catch (err) {
    console.error('Error executing git:', err.message);
    if (err.stdout) console.log('STDOUT:', err.stdout);
    if (err.stderr) console.error('STDERR:', err.stderr);
  }
}

console.log('--- EXECUTANDO COMANDOS GIT PARA RELEASE V0.2.26 ---');
runGit('add .');
runGit('commit -m "release: v0.2.26 - cadastro em lote de bastoes, radios e coletes no RPMon"');
runGit('tag v0.2.26');
runGit('push origin main');
runGit('push origin v0.2.26');
console.log('--- FINALIZADO ---');
