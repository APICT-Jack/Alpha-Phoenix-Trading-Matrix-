// fix-semver.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const truncatePath = path.join(__dirname, 'node_modules', 'semver', 'functions', 'truncate.js');

function createTruncateFile() {
  const dir = path.dirname(truncatePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const content = `const { SemVer } = require('../classes/semver');
const parse = require('./parse');
const re = require('../internal/re');
const { MAX_LENGTH } = require('../internal/constants');

const truncate = (version, length = MAX_LENGTH) => {
  if (typeof version !== 'string') {
    version = String(version);
  }
  if (version.length <= length) {
    return version;
  }
  const truncated = version.slice(0, length);
  const lastHyphen = truncated.lastIndexOf('-');
  if (lastHyphen > 0) {
    return truncated.slice(0, lastHyphen);
  }
  return truncated;
};

module.exports = truncate;
`;
  
  fs.writeFileSync(truncatePath, content);
  console.log('✅ Created missing truncate.js file');
}

if (!fs.existsSync(truncatePath)) {
  console.log('🔧 truncate.js is missing, attempting to fix...');
  
  // Try to reinstall semver first
  try {
    console.log('Reinstalling semver...');
    execSync('npm install semver@7.6.3 --save --legacy-peer-deps', {
      stdio: 'inherit',
      cwd: __dirname
    });
    console.log('✅ semver reinstalled successfully');
  } catch (error) {
    console.log('Failed to reinstall semver, creating file manually...');
    createTruncateFile();
  }
  
  // Verify the file exists now
  if (fs.existsSync(truncatePath)) {
    console.log('✅ truncate.js fix completed');
  } else {
    console.log('Creating file manually...');
    createTruncateFile();
  }
} else {
  console.log('✅ truncate.js already exists');
}