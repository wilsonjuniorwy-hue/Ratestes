const { execFile } = require('child_process');
const path = require('path');

const gitCmdDir = 'C:\\Users\\wagne\\AppData\\Local\\GitHubDesktop\\app-3.4.15\\resources\\app\\git\\cmd';
const gitExe = path.join(gitCmdDir, 'git.exe');

const env = {
  ...process.env,
  Path: `${gitCmdDir};${process.env.Path || ''}`,
  PATH: `${gitCmdDir};${process.env.PATH || ''}`
};

const cwd = 'G:\\Sistemas\\gestão-de-reserva-de-armamento-pm';

function runGit(args) {
  return new Promise((resolve, reject) => {
    console.log(`> git ${args.join(' ')}`);
    execFile(gitExe, args, { cwd, env, encoding: 'utf8' }, (err, stdout, stderr) => {
      if (err) {
        console.error('ERROR:', err.message);
        if (stderr) console.error('STDERR:', stderr);
        reject(err);
      } else {
        if (stdout) console.log(stdout.trim());
        resolve(stdout);
      }
    });
  });
}

async function main() {
  try {
    await runGit(['--version']);
    await runGit(['status']);
    console.log('--- ENVIANDO RELEASE V0.2.26 AO GITHUB ---');
    await runGit(['add', '.']);
    try {
      await runGit(['commit', '-m', 'release: v0.2.26 - cadastro em lote de bastoes, radios e coletes no RPMon']);
    } catch (e) {
      console.log('Commit ja pode ter sido realizado ou sem mudancas adicionais.');
    }
    try {
      await runGit(['tag', 'v0.2.26']);
    } catch (e) {
      console.log('Tag v0.2.26 ja existe localmente.');
    }
    await runGit(['push', 'origin', 'main']);
    await runGit(['push', 'origin', 'v0.2.26']);
    console.log('🎉 SUCESSO TOTAL! RELEASE V0.2.26 ENVIADO AO GITHUB E DISPARADO COM SUCESSO!');
  } catch (err) {
    console.error('FALHA NO ENVIO DO GITHUB');
  }
}

main();
