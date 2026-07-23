const { spawnSync } = require('child_process');
const path = require('path');

const gitExe = 'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\cmd\\git.exe';
const cwd = 'g:\\Sistemas\\gestão-de-reserva-de-armamento-pm';

function runGit(args) {
  console.log(`> git ${args.join(' ')}`);
  const res = spawnSync(gitExe, args, { cwd, encoding: 'utf8', env: process.env });
  if (res.error) {
    console.error('SPAWN ERROR:', res.error);
  } else {
    console.log('STDOUT:', res.stdout);
    if (res.stderr) console.error('STDERR:', res.stderr);
  }
}

console.log('--- TESTANDO GIT VIA SPAWNSYNC ---');
runGit(['--version']);
runGit(['status']);

console.log('--- ENVIANDO RELEASE V0.2.26 ---');
runGit(['add', '.']);
runGit(['commit', '-m', 'release: v0.2.26 - cadastro em lote de bastoes, radios e coletes no RPMon']);
runGit(['tag', 'v0.2.26']);
runGit(['push', 'origin', 'main']);
runGit(['push', 'origin', 'v0.2.26']);
