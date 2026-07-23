const { execSync } = require('child_process');

const gitDir = 'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\cmd';
const env = {};
for (const key in process.env) {
  env[key] = process.env[key];
}

// Em Windows, Path é com P maiúsculo
const existingPath = env.Path || env.PATH || env.path || '';
env.Path = `${gitDir};${existingPath}`;
env.PATH = `${gitDir};${existingPath}`;

const cwd = 'G:\\Sistemas\\gestão-de-reserva-de-armamento-pm';

console.log('Testing git version with Windows Path...');
try {
  const ver = execSync('git --version', { cwd, env, encoding: 'utf8' });
  console.log('GIT VERSION:', ver.trim());

  console.log('--- EXECUTANDO COMANDOS GIT DO RELEASE V0.2.26 ---');
  console.log(execSync('git add .', { cwd, env, encoding: 'utf8' }));
  console.log(execSync('git commit -m "release: v0.2.26 - cadastro em lote de bastoes, radios e coletes no RPMon"', { cwd, env, encoding: 'utf8' }));
  console.log(execSync('git tag v0.2.26', { cwd, env, encoding: 'utf8' }));
  console.log(execSync('git push origin main', { cwd, env, encoding: 'utf8' }));
  console.log(execSync('git push origin v0.2.26', { cwd, env, encoding: 'utf8' }));
  console.log('=== RELEASE V0.2.26 ENVIADO PARA O GITHUB COM SUCESSO! ===');
} catch (err) {
  console.error('ERROR:', err.message);
  if (err.stdout) console.log('STDOUT:', err.stdout);
  if (err.stderr) console.error('STDERR:', err.stderr);
}
