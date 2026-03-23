import {spawnSync, execSync} from 'child_process';
import {createInterface} from 'readline';
import {readFileSync, existsSync} from 'fs';

function run(command, args, env, silent = false) {
  if (!silent) {
    console.log(`[BUILD] Running: ${command} ${args.join(' ')}`);
  }
  const result = spawnSync(command, args, {
    stdio: silent ? 'pipe' : 'inherit',
    env,
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}`);
  }
  return result;
}

function runSilent(command, args, env) {
  const result = spawnSync(command, args, {
    encoding: 'utf-8',
    env,
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    return null;
  }
  return result.stdout?.trim();
}

function parsePackageVersion() {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
  return packageJson.version;
}

function validateVersion(version) {
  if (!/^(\d+)\.(\d+)\.(\d+)(-.*)?$/.test(version)) {
    throw new Error(`Invalid version format: ${version}. Expected: x.y.z or x.y.z-prerelease`);
  }
}

function checkGitStatus() {
  // Check if we're in a git repo
  try {
    execSync('git rev-parse --git-dir', {stdio: 'pipe'});
  } catch {
    throw new Error('Not a git repository. Please run from a git repo.');
  }

  // Check for uncommitted changes
  const status = runSilent('git', ['status', '--porcelain']);
  if (status) {
    console.log('[GIT] Uncommitted changes detected:');
    console.log(status);
    throw new Error('Working directory not clean. Please commit or stash changes first.');
  }

  // Check if we can push
  const currentBranch = runSilent('git', ['branch', '--show-current']);
  console.log(`[GIT] Current branch: ${currentBranch}`);

  // Fetch to ensure we have latest
  console.log('[GIT] Fetching from remote...');
  run('git', ['fetch'], process.env, true);

  // Check if branch is up to date
  const local = runSilent('git', ['rev-parse', '@']);
  const remote = runSilent('git', ['rev-parse', '@{u}']);
  const base = runSilent('git', ['merge-base', '@', '@{u}']);

  if (local !== remote) {
    if (local === base) {
      throw new Error('Local branch is behind remote. Please pull first.');
    } else if (remote === base) {
      console.log('[GIT] Local commits need to be pushed.');
    } else {
      throw new Error('Branch has diverged. Please resolve before releasing.');
    }
  }
}

function getCommitsSinceLastTag() {
  const lastTag = runSilent('git', ['describe', '--tags', '--abbrev=0']);
  if (!lastTag) {
    // No previous tag, get all commits
    return runSilent('git', ['log', '--pretty=format:- %s']);
  }
  return runSilent('git', ['log', `${lastTag}..HEAD`, '--pretty=format:- %s']);
}

function tagExists(tag) {
  const result = runSilent('git', ['rev-parse', `refs/tags/${tag}`]);
  return !!result;
}

function createGitTag(version, message) {
  const tag = `v${version}`;
  console.log(`[GIT] Creating tag ${tag}...`);
  run('git', ['tag', '-a', tag, '-m', message || `Release ${tag}`], process.env);
  console.log(`[GIT] Pushing tag ${tag}...`);
  run('git', ['push', 'origin', tag], process.env);
  return tag;
}

function getReleaseNotes(version) {
  // Priority 1: RELEASE_NOTES env var
  if (process.env.RELEASE_NOTES) {
    console.log('[RELEASE] Using RELEASE_NOTES from environment');
    return process.env.RELEASE_NOTES;
  }

  // Priority 2: CHANGELOG.md
  if (existsSync('CHANGELOG.md')) {
    console.log('[RELEASE] Reading from CHANGELOG.md...');
    const changelog = readFileSync('CHANGELOG.md', 'utf-8');
    // Try to find section for this version
    const versionHeader = new RegExp(`##\\s*\\[?${version.replace(/\./g, '\\.')}]\\?`, 'i');
    const match = changelog.match(versionHeader);
    if (match) {
      const start = match.index;
      // Find next version header or end
      const nextVersion = changelog.indexOf('## [', start + match[0].length);
      const notes = nextVersion > 0
        ? changelog.slice(start, nextVersion).trim()
        : changelog.slice(start).trim();
      return notes;
    }
  }

  // Priority 3: Auto-generate from git commits
  console.log('[RELEASE] Generating release notes from git commits...');
  const commits = getCommitsSinceLastTag();
  if (commits) {
    return `## Changes in v${version}\n\n${commits}`;
  }

  return null;
}

function getLatestChangelogVersion() {
  if (!existsSync('CHANGELOG.md')) {
    return null;
  }

  const changelog = readFileSync('CHANGELOG.md', 'utf-8');
  // Match version headers like ## [1.9.0] or ## 1.9.0
  const versionRegex = /##\s*\[?(\d+\.\d+\.\d+(-[\w.]+)?)\]?/g;
  const versions = [];
  let match;

  while ((match = versionRegex.exec(changelog)) !== null) {
    versions.push(match[1]);
  }

  return versions.length > 0 ? versions[0] : null;
}

function validateChangelogVersion(packageVersion) {
  const changelogVersion = getLatestChangelogVersion();

  if (!changelogVersion) {
    console.warn('[RELEASE] ⚠️  No version found in CHANGELOG.md');
    console.warn('   Ensure CHANGELOG.md has a section like ## [1.9.0] or ## 1.9.0');
    throw new Error('CHANGELOG.md version validation failed');
  }

  if (changelogVersion !== packageVersion) {
    console.error(`\n❌ VERSION MISMATCH!`);
    console.error(`   package.json version: ${packageVersion}`);
    console.error(`   CHANGELOG.md latest: ${changelogVersion}`);
    console.error(`\n   Please update CHANGELOG.md to include version ${packageVersion} at the top.`);
    throw new Error(`CHANGELOG.md version (${changelogVersion}) does not match package.json (${packageVersion})`);
  }

  console.log(`[RELEASE] ✓ CHANGELOG.md version matches: ${changelogVersion}`);
}

function getRepoInfo() {
  const owner = process.env.RELEASE_GITHUB_OWNER;
  const repo = process.env.RELEASE_GITHUB_REPO;

  if (owner && repo) {
    return {owner, repo};
  }

  // Try to get from git remote
  try {
    const remoteUrl = execSync('git remote get-url origin', {encoding: 'utf-8'}).trim();
    // Handle both HTTPS and SSH formats
    // HTTPS: https://github.com/owner/repo.git
    // SSH: git@github.com:owner/repo.git
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      return {owner: match[1], repo: match[2]};
    }
  } catch {
    // Fall through to error
  }

  throw new Error(
    'Could not determine GitHub repo. Please set RELEASE_GITHUB_OWNER and RELEASE_GITHUB_REPO env vars.',
  );
}

async function requestGitHub(url, token, method = 'GET', body, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API ${method} ${url} failed: ${response.status} ${errorText}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
      console.log(`[RETRY] Attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`[RETRY] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

async function promptReleaseNotes(version) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\nNhập release notes cho v${version}.`);
  console.log('Kết thúc bằng một dòng chỉ chứa :end\n');

  const lines = [];
  let isDone = false;
  while (!isDone) {
    const line = await new Promise(resolve => rl.question('', resolve));
    if (line.trim() === ':end') {
      isDone = true;
      continue;
    }
    lines.push(line);
  }

  rl.close();
  return lines.join('\n').trim();
}

async function getOrCreateRelease(owner, repo, tag, version, token) {
  try {
    // Try to get existing release
    console.log(`[RELEASE] Checking for existing release: ${tag}`);
    return await requestGitHub(
      `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`,
      token,
    );
  } catch (err) {
    if (err.message.includes('404')) {
      // Release doesn't exist, create it as draft
      console.log(`[RELEASE] Release not found, creating draft release...`);
      return await requestGitHub(
        `https://api.github.com/repos/${owner}/${repo}/releases`,
        token,
        'POST',
        {
          tag_name: tag,
          name: `v${version}`,
          draft: true,
          prerelease: false,
        },
      );
    }
    throw err;
  }
}

async function publishReleaseFromDraft() {
  if (process.env.SKIP_RELEASE_PUBLISH === '1') {
    console.log('[RELEASE] SKIP_RELEASE_PUBLISH=1, skipping release publish.');
    return;
  }

  const token = process.env.GH_TOKEN;
  if (!token) {
    console.log('[RELEASE] Không tìm thấy GH_TOKEN, bỏ qua bước publish release.');
    return;
  }

  const {owner, repo} = getRepoInfo();
  const version = parsePackageVersion();

  validateVersion(version);

  const tag = `v${version}`;

  // Check if release already exists and is published
  let existingRelease = null;
  try {
    existingRelease = await requestGitHub(
      `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`,
      token,
    );
    if (!existingRelease.draft) {
      console.warn(`\n⚠️  WARNING: Release ${tag} already exists and is PUBLISHED!`);
      console.warn('   This build will ADD artifacts to the existing release.');
      console.warn('   If you intended to update release notes, ensure CHANGELOG.md is updated.\n');
    }
  } catch (err) {
    if (!err.message.includes('404')) {
      throw err;
    }
    // 404 is fine - release doesn't exist yet
  }

  // Get release notes
  let notes = getReleaseNotes(version);

  // If no notes and interactive, prompt
  if (!notes && process.stdin.isTTY) {
    notes = await promptReleaseNotes(version);
  }

  if (!notes) {
    if (!process.stdin.isTTY) {
      console.log('[RELEASE] Non-interactive mode. Set RELEASE_NOTES env var or add to CHANGELOG.md');
    }
    throw new Error('Release notes không được để trống.');
  }

  // Create git tag if doesn't exist
  if (!tagExists(tag)) {
    createGitTag(version, notes.split('\n')[0]);
  } else {
    console.log(`[GIT] Tag ${tag} already exists`);
  }

  console.log(`[RELEASE] Publishing release ${tag} to ${owner}/${repo}`);

  // Get or create release
  const release = await getOrCreateRelease(owner, repo, tag, version, token);

  // Publish the release
  console.log(`[RELEASE] Publishing draft release ${release.id}...`);
  const updatedRelease = await requestGitHub(
    `https://api.github.com/repos/${owner}/${repo}/releases/${release.id}`,
    token,
    'PATCH',
    {
      draft: false,
      prerelease: false,
      body: notes,
      name: release.name || `v${version}`,
    },
  );

  console.log(`\n✅ Đã publish release: ${updatedRelease.html_url}`);
}

async function main() {
  try {
    const env = {
      ...process.env,
      MODE: 'production',
    };

    const version = parsePackageVersion();
    console.log(`[BUILD] Starting release flow for v${version} - ${process.platform} ${process.arch}`);

    // Step 1: Validate version formats
    validateVersion(version);

    // Step 2: Validate CHANGELOG.md version matches package.json
    validateChangelogVersion(version);

    // Step 3: Git checks
    checkGitStatus();

    // Step 2: Build
    console.log('[BUILD] Building app...');
    run('pnpm', ['run', 'build'], env);

    // Use 'onTag' - electron-builder will publish when it sees the tag
    const configArgs = ['--config', '.electron-builder.config.js', '--publish', 'onTag'];
    const platform = process.env.RELEASE_PLATFORM || process.platform;
    const arch = process.env.RELEASE_ARCH || process.arch;

    console.log(`[BUILD] Building app with electron-builder...`);
    console.log(`[BUILD] Platform: ${platform}, Arch: ${arch}`);

    if (platform === 'darwin') {
      const macArch = arch === 'arm64' ? '--arm64' : '--x64';
      run('electron-builder', ['--mac', macArch, ...configArgs], env);
      await publishReleaseFromDraft();
      process.exit(0);
    }

    if (platform === 'win32') {
      const winArch = arch === 'arm64' ? '--arm64' : '--x64';
      run('electron-builder', ['--win', winArch, ...configArgs], env);
      await publishReleaseFromDraft();
      process.exit(0);
    }

    if (platform === 'linux') {
      run('electron-builder', ['--linux', ...configArgs], env);
      await publishReleaseFromDraft();
      process.exit(0);
    }

    throw new Error(`Unsupported platform: ${platform}`);
  } catch (err) {
    console.error('\n❌ Release failed:', err.message);
    process.exit(1);
  }
}

main();
