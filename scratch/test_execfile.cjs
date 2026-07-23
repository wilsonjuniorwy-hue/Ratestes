const { execFile } = require('child_process');
const path = require('path');

const gitExe = 'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\cmd\\git.exe';
const gitBinDir = 'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\mingw64\\bin;C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\usr\\bin;C:\\Windows\\system32;C:\\Windows';

const env = {
  ...process.env,
  Path: `${gitBinDir};${process.env.Path || ''}`,
  PATH: `${gitBinDir};${process.env.PATH || ''}`
};

const cwd = 'G:\\Sistemas\\gestão-de-reserva-de-armamento-pm';

function runGitFile(args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: git ${args.join(' ')}`);
    execFile(gitExe, args, { cwd, env, encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err) {
        console.error('FAIL:', err.message);
        if (stderr) console.error('STDERR:', stderr);
        reject(err);
      } else {
        console.log('OK:', stdout);
        resolve(stdout);
      }
    });
  });
}

async function main() {
  try {
    await runGitFile(['--version']);
    await runGitFile(['status']);
    console.log('--- ENVIANDO RELEASE V0.2.26 ---');
    await runGitFile(['add', '.']);
    await runGitFile(['commit', '-m', 'release: v0.2.26 - cadastro em lote de bastoes, radios e coletes no RPMon']);
    await runGitFile(['tag', 'v0.2.26']);
    await runGitFile(['push', 'origin', 'main']);
    await runGitFile(['push', 'origin', 'v0.2.26']);
    console.log('=== SUCESSO ABSOLUTO! TUDO NO GITHUB COM TAG V0.2.26 ===');
  } catch (e) {
    console.error('EXECUTION STOPPED ON ERROR');
  }
}

main();
