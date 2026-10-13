const fs = require('fs');
const path = require('path');

function replaceImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      replaceImports(filePath);
    } else if (filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/from\s+['"](\..*?)['"]/g, "from '$1.js'");
      // Also catch imports like "import { AuthModule } from './core/auth/auth.module';"
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

replaceImports(path.join(__dirname, 'src'));
console.log('Fixed imports!');
