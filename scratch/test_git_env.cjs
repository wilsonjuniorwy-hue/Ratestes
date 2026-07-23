const { execSync } = require('child_process');
const path = require('path');

const gitBinDir = 'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\cmd;C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\mingw64\\bin;C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\usr\\bin';
const env = { ...process.env, PATH: `${gitBinDir};${process.env.PATH}` };
const cwd = path.join(__dirname, '..');

console.log('Testing git version with PATH set...');
try {
  const ver = execSync('git --version', { env, cwd, encoding: 'utf8' });
  console.log('GIT VERSION:', ver.trim());

  console.log('--- EXECUTANDO RELEASE COMPLETO DO GIT ---');
  console.log(execSync('git add .', { env, cwd, encoding: 'utf8' }));
  console.log(execSync('git commit -m "release: v0.2.26 - cadastro em lote de bastoes, radios e coletes no RPMon"', { env, cwd, encoding: 'utf8' }));
  console.log(execSync('git tag v0.2.26', { env, cwd, encoding: 'utf8' }));
  console.log(execSync('git push origin main', { env, cwd, encoding: 'utf8' }));
  console.log(execSync('git push origin v0.2.26', { env, cwd, encoding: 'utf8' }));
  console.log('--- SUCESSO TOTAL NO RELEASE! ---');
} catch (err) {
  console.error('ERROR:', err.message);
  if (err.stdout) console.log('STDOUT:', err.stdout);
  if (err.stderr) console.error('STDERR:', err.stderr);
}
