// scripts/update-version.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get current package.json
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Parse current version
const [major, minor, patch] = packageJson.version.split('.').map(Number);

// Determine version increment based on environment variable
// - patch: bug fixes (default)
// - minor: new features
// - major: breaking changes
// - auto: automatic based on commit message
const incrementType = process.env.VERSION_TYPE || 'auto';

let newPatch = patch;
let newMinor = minor;
let newMajor = major;

// Auto-detect from git commit message if available
if (incrementType === 'auto') {
  try {
    const commitMsg = execSync('git log -1 --pretty=%B').toString().trim();
    if (commitMsg.includes('#major') || commitMsg.includes('BREAKING CHANGE')) {
      newMajor = major + 1;
      newMinor = 0;
      newPatch = 0;
      console.log('🔴 Major version detected from commit message');
    } else if (commitMsg.includes('#minor') || commitMsg.includes('feat:')) {
      newMinor = minor + 1;
      newPatch = 0;
      console.log('🟡 Minor version detected from commit message');
    } else {
      newPatch = patch + 1;
      console.log('🟢 Patch version detected from commit message');
    }
  } catch {
    // If no git, default to patch
    newPatch = patch + 1;
    console.log('🟢 Defaulting to patch version');
  }
} else {
  switch (incrementType) {
    case 'major':
      newMajor = major + 1;
      newMinor = 0;
      newPatch = 0;
      break;
    case 'minor':
      newMinor = minor + 1;
      newPatch = 0;
      break;
    case 'patch':
    default:
      newPatch = patch + 1;
      break;
  }
}

const newVersion = `${newMajor}.${newMinor}.${newPatch}`;

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

// Get git commit hash
let gitHash = 'local';
try {
  gitHash = execSync('git rev-parse HEAD').toString().trim().slice(0, 7);
} catch (e) {
  console.log('⚠️ No git repository found, using "local"');
}

// Get build number from environment or generate
const buildNumber = parseInt(process.env.BUILD_NUMBER) || Math.floor(Date.now() / 1000);

// Get environment
const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

// Get Vercel deployment ID if available
const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || 'local';

// Create lib/version directory if it doesn't exist
const versionDir = path.join(__dirname, '../lib/version');
if (!fs.existsSync(versionDir)) {
  fs.mkdirSync(versionDir, { recursive: true });
}

// Write version file for frontend
const versionFilePath = path.join(versionDir, 'version.json');
const versionData = {
  version: newVersion,
  major: newMajor,
  minor: newMinor,
  patch: newPatch,
  build: buildNumber,
  hash: gitHash,
  environment: environment,
  deploymentId: deploymentId,
  date: new Date().toISOString(),
  incrementType: incrementType,
  autoUpdate: true,
};

fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));

console.log(`
╔═══════════════════════════════════════════════════════════╗
║              📦 VERSION UPDATED SUCCESSFULLY              ║
╠═══════════════════════════════════════════════════════════╣
║  Version:  v${newVersion}                                    ║
║  Build:    #${buildNumber}                                    ║
║  Hash:     ${gitHash}                                        ║
║  Env:      ${environment}                                    ║
║  Deploy:   ${deploymentId}                                   ║
╚═══════════════════════════════════════════════════════════╝
`);