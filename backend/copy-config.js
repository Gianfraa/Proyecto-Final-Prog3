const fs = require('fs');
const path = require('path');

const distConfigDir = path.join(__dirname, 'dist', 'config');
if (!fs.existsSync(distConfigDir)) {
  fs.mkdirSync(distConfigDir, { recursive: true });
}

const configDir = path.join(__dirname, 'config');
const files = fs.readdirSync(configDir).filter(file => file.endsWith('.js'));

files.forEach(file => {
  const source = path.join(configDir, file);
  const dest = path.join(distConfigDir, file);
  fs.copyFileSync(source, dest);
  console.log(`Copied ${file} to dist/config`);
});
