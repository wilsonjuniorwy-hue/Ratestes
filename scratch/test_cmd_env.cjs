const { execSync } = require('child_process');
const path = require('path');

const cwd = 'G:\\Sistemas\\gestão-de-reserva-de-armamento-pm';
const gitPath = 'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\cmd';
const env = { ...process.env, PATH: `${gitPath};${process.env.PATH}` };

console.log('Testing git status with PATH...');
try {
  const out1 = execSync('git status', { cwd, env, encoding: 'utf8' });
  console.log('GIT STATUS:', out1);

  console.log('--- EXECUTANDO COMANDOS DE RELEASE DO GIT ---');
  console.log(execSync('git add .', { cwd, env, encoding: 'utf8' }));
  console.log(execSync('git commit -m "release: v0.2.26 - cadastro em lote de bastoes, radios e coletes no RPMon"', { cwd, env, encoding: 'utf8' }));
  console.log(execSync('git tag v0.2.26', { cwd, env, encoding: 'utf8' }));
  console.log(execSync('git push origin main', { cwd, env, encoding: 'utf8' }));
  console.log(execSync('git push origin v0.2.26', { cwd, env, encoding: 'utf8' }));
  console.log('--- TUDO ENVIADO AO GITHUB COM SUCESSO! ---');
} catch (err) {
  console.error('ERROR:', err.message);
  if (err.stdout) console.log('STDOUT:', err.stdout);
  if (err.stderr) console.error('STDERR:', err.stderr);
}
