const { execSync } = require('child_process');

const paths = [
  'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\cmd\\git.exe',
  'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\bin\\git.exe',
  'C:\\Users\\wagne\\AppData\\Local\\Programs\\Git\\mingw64\\bin\\git.exe'
];

for (const p of paths) {
  try {
    const res = execSync(`"${p}" --version`, { encoding: 'utf8' });
    console.log(`PATH SUCCESS [${p}]:`, res.trim());
  } catch (err) {
    console.log(`PATH FAILED [${p}]:`, err.message);
  }
}
