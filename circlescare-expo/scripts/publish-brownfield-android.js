#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const androidRoot = path.join(projectRoot, 'android');
const androidLocalPropertiesPath = path.resolve(projectRoot, '..', 'circlescare-android', 'local.properties');
const isWindows = process.platform === 'win32';

function readGradleProperties(filePath) {
  const properties = {};

  if (!fs.existsSync(filePath)) {
    return properties;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) {
      continue;
    }

    const separatorIndex = line.search(/[:=]/);
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    properties[key] = value;
  }

  return properties;
}

function fail(message) {
  console.error(`\n[brownfield-publish] ERROR: ${message}\n`);
  process.exit(1);
}

function warn(message) {
  console.warn(`[brownfield-publish] WARNING: ${message}`);
}

function runStep(command, args, cwd, env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// --- Credentials ---
// Resolution order:
//   1. env vars         — CI (GITHUB_ACTOR/GITHUB_TOKEN injected by GitHub Actions)
//   2. local.properties — local dev (circlescare-android/local.properties, gitignored)

const localProps = readGradleProperties(androidLocalPropertiesPath);

const githubActor = process.env.GITHUB_ACTOR || localProps['gpr.user'];
const githubToken = process.env.GITHUB_TOKEN || localProps['gpr.key'];

if (!githubActor || !githubToken) {
  fail(
    [
      'Missing GitHub Packages credentials. Checked (in order):',
      `  1. GITHUB_ACTOR / GITHUB_TOKEN env vars (CI)`,
      `  2. gpr.user / gpr.key in ${androidLocalPropertiesPath} (local dev)`,
      'Use a personal access token (classic) with read:packages and write:packages.',
    ].join('\n         ')
  );
}

if (/YOUR_|github_pat_example|TOKEN_HERE/i.test(githubToken)) {
  fail('The configured GitHub token looks like a placeholder. Replace it with a real personal access token (classic).');
}

// --- Version sync check ---
// Both app.json (Expo side) and circlescare-android/gradle/libs.versions.toml (host side)
// must agree on the version before publishing. GitHub Packages does not allow overwriting
// an already-published version, so both sides should be bumped together.

const appJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'));
const publishVersion = appJson.expo?.version;
if (!publishVersion) {
  fail('Could not read expo.version from app.json.');
}

const libsVersionsPath = path.resolve(projectRoot, '..', 'circlescare-android', 'gradle', 'libs.versions.toml');
if (fs.existsSync(libsVersionsPath)) {
  const libsContent = fs.readFileSync(libsVersionsPath, 'utf8');
  const match = libsContent.match(/^brownfield\s*=\s*"([^"]+)"/m);
  if (match) {
    const hostVersion = match[1];
    if (hostVersion !== publishVersion) {
      fail(
        [
          `Version mismatch between Expo app and Android host:`,
          `  app.json               → ${publishVersion}`,
          `  libs.versions.toml     → ${hostVersion}`,
          `Update both to the same value before publishing.`,
          `GitHub Packages does not allow overwriting an existing version once published.`,
        ].join('\n         ')
      );
    }
  } else {
    warn('Could not find brownfield version in libs.versions.toml — skipping sync check.');
  }
} else {
  warn(`Android host libs.versions.toml not found at ${libsVersionsPath} — skipping sync check.`);
}

// --- Publish ---

const env = {
  ...process.env,
  GITHUB_ACTOR: githubActor,
  GITHUB_TOKEN: githubToken,
  NODE_ENV: process.env.NODE_ENV || 'production',
};

console.log(`\n[brownfield-publish] Actor  : ${githubActor}`);
console.log(`[brownfield-publish] Version: ${publishVersion}`);
console.log('[brownfield-publish] Target : https://maven.pkg.github.com/iniyan-circles/Expo');
console.log('[brownfield-publish] Starting publish...\n');

runStep(isWindows ? 'npm.cmd' : 'npm', ['install'], projectRoot, env);
runStep(
  isWindows ? 'npx.cmd' : 'npx',
  ['expo', 'prebuild', '-p', 'android', '--clean', '--no-install'],
  projectRoot,
  env
);
runStep(
  isWindows ? 'gradlew.bat' : './gradlew',
  ['publishBrownfieldReleasePublicationToGithubPackagesRepository', '--stacktrace'],
  androidRoot,
  env
);

console.log(`\n[brownfield-publish] Done. Artifact ${publishVersion} is now available at:`);
console.log('  https://github.com/iniyan-circles/Expo/packages');
console.log('\n[brownfield-publish] Next: update circlescare-android to use this version and run a new Android build.\n');
