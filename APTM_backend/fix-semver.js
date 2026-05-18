// fix-semver.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const truncatePath = path.join(__dirname, 'node_modules', 'semver', 'functions', 'truncate.js');

// Create the missing file
const dir = path.dirname(truncatePath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const content = `module.exports = (version, length = 256) => {
  if (typeof version !== 'string') return version;
  if (version.length <= length) return version;
  const truncated = version.slice(0, length);
  const lastHyphen = truncated.lastIndexOf('-');
  if (lastHyphen > 0) return truncated.slice(0, lastHyphen);
  return truncated;
};`;

fs.writeFileSync(truncatePath, content);
console.log('✅ semver truncate.js created');