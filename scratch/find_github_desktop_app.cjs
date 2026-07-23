const fs = require('fs');
const path = require('path');

const ghFolder = 'C:\\Users\\wagne\\AppData\\Local\\GitHubDesktop';
if (fs.existsSync(ghFolder)) {
  const files = fs.readdirSync(ghFolder);
  for (const f of files) {
    if (f.startsWith('app-')) {
      const gitCmdPath = path.join(ghFolder, f, 'resources', 'app', 'git', 'cmd', 'git.exe');
      console.log(`Checking ${f}: exists?`, fs.existsSync(gitCmdPath), gitCmdPath);
    }
  }
} else {
  console.log('GitHubDesktop folder not found!');
}
