const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src/app', function(filePath) {
  if (filePath.endsWith('.ts') && !filePath.endsWith('.service.ts') && !filePath.endsWith('.spec.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    // Strip multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // Strip single line comments (but not inside urls like http://)
    content = content.replace(/(?<![:'"])\/\/.*/g, '');
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Stripped comments from: ' + filePath);
    }
  }
});
