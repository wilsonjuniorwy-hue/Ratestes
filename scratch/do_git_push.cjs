const { spawnSync } = require('child_process');
const path = require('path');

const gitCmdExe = 'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\git-cmd.exe';
const cwd = 'g:\\Sistemas\\gestão-de-reserva-de-armamento-pm';

function runInGitCmd(commandStr) {
  console.log(`Executing in Git CMD: ${commandStr}`);
  const res = spawnSync(gitCmdExe, ['/c', commandStr], { cwd, encoding: 'utf8' });
  console.log('STDOUT:', res.stdout);
  if (res.stderr) console.error('STDERR:', res.stderr);
  return res;
}

console.log('--- TESTANDO GIT STATUS ---');
runInGitCmd('git status');

console.log('--- ENVIANDO RELEASE V0.2.26 AO GITHUB ---');
runInGitCmd('git add .');
runInGitCmd('git commit -m "release: v0.2.26 - cadastro em lote de bastoes, radios e coletes no RPMon"');
runInGitCmd('git tag v0.2.26');
runInGitCmd('git push origin main');
runInGitCmd('git push origin v0.2.26');
console.log('--- CONCLUÍDO ---');
