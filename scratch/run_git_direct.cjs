const { execSync } = require('child_process');
const path = require('path');

const env = {
  ...process.env,
  PATH: `C:\\Windows\\system32;C:\\Windows;C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\cmd;C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\mingw64\\bin;C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\usr\\bin;${process.env.PATH || ''}`
};

const gitCmd = 'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\cmd\\git.exe';
const cwd = 'g:\\Sistemas\\gestão-de-reserva-de-armamento-pm';

function execGit(args) {
  console.log(`> git ${args}`);
  try {
    const out = execSync(`"${gitCmd}" ${args}`, { cwd, env, encoding: 'utf8' });
    console.log(out);
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.stdout) console.log('STDOUT:', err.stdout);
    if (err.stderr) console.error('STDERR:', err.stderr);
  }
}

console.log('Testing git version...');
execGit('--version');
execGit('status');

console.log('--- RUNNING RELEASE V0.2.26 ---');
execGit('add .');
execGit('commit -m "release: v0.2.26 - cadastro em lote de bastoes, radios e coletes no RPMon"');
execGit('tag v0.2.26');
execGit('push origin main');
execGit('push origin v0.2.26');
