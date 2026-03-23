import {spawnSync, execSync} from 'child_process';
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
  // const status = runSilent('git', ['status', '--porcelain']);
  // if (status) {
  //   console.log('[GIT] Uncommitted changes detected:');
  //   console.log(status);
  //   throw new Error('Working directory not clean. Please commit or stash changes first.');
  // }

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

function stripVersionHeading(notes, version) {
  if (!notes) {
    return notes;
  }

  const lines = notes.split('\n');
  const versionPattern = version.replace(/\./g, '\\.');
  const headingRegex = new RegExp(`^##\\s*\\[?${versionPattern}\\]?\\s*$`, 'i');
  if (lines.length > 0 && headingRegex.test(lines[0].trim())) {
    // Remove heading line and any immediately following blank lines
    lines.shift();
    while (lines.length > 0 && lines[0].trim() === '') {
      lines.shift();
    }
  }

  return lines.join('\n').trim();
}

function getReleaseNotes(version) {
  // Priority 1: RELEASE_NOTES env var
  if (process.env.RELEASE_NOTES) {
    console.log('[RELEASE] Using RELEASE_NOTES from environment');
    return stripVersionHeading(process.env.RELEASE_NOTES, version);
  }

  // Priority 2: CHANGELOG.md
  if (existsSync('CHANGELOG.md')) {
    console.log('[RELEASE] Reading from CHANGELOG.md...');
    const changelog = readFileSync('CHANGELOG.md', 'utf-8');
    // Try to find section for this version
    // Match ## [1.8.1] or ## 1.8.1
    const versionPattern = version.replace(/\./g, '\\.');
    const versionHeader = new RegExp(`##\\s*\\[?${versionPattern}\\]?`, 'i');
    const match = changelog.match(versionHeader);
    if (match) {
      const start = match.index;
      // Find next version header or end
      const nextVersion = changelog.indexOf('## [', start + match[0].length);
      const notes = nextVersion > 0
        ? changelog.slice(start, nextVersion).trim()
        : changelog.slice(start).trim();
      return stripVersionHeading(notes, version);
    }
  }

  // Priority 3: Auto-generate from git commits
  console.log('[RELEASE] Generating release notes from git commits...');
  const commits = getCommitsSinceLastTag();
  if (commits) {
    return stripVersionHeading(`## Changes in v${version}\n\n${commits}`, version);
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
  // Priority 1: app-update.yml (release target repo)
  if (existsSync('app-update.yml')) {
    try {
      const yamlContent = readFileSync('app-update.yml', 'utf-8');
      const ownerMatch = yamlContent.match(/owner:\s*(.+)/);
      const repoMatch = yamlContent.match(/repo:\s*(.+)/);
      if (ownerMatch && repoMatch) {
        const owner = ownerMatch[1].trim();
        const repo = repoMatch[1].trim();
        console.log(`[RELEASE] Using repo from app-update.yml: ${owner}/${repo}`);
        return {owner, repo};
      }
    } catch {
      // Fall through to next option
    }
  }

  // Priority 2: Environment variables
  const owner = process.env.RELEASE_GITHUB_OWNER;
  const repo = process.env.RELEASE_GITHUB_REPO;

  if (owner && repo) {
    return {owner, repo};
  }

  // Priority 3: Git remote
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
        const error = new Error(`GitHub API ${method} ${url} failed: ${response.status} ${errorText}`);
        // Don't retry on 404 - it's expected when release doesn't exist
        if (response.status === 404) {
          throw error;
        }
        throw error;
      }

      return response.json();
    } catch (error) {
      lastError = error;
      // Don't retry on 404 errors
      if (error.message.includes('404')) {
        throw error;
      }
      console.log(`[RETRY] Attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[RETRY] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

async function ensureRelease(owner, repo, tag, version, token) {
  if (!token) {
    console.warn('[RELEASE] GH_TOKEN is required to manage releases. Skipping ensureRelease.');
    return null;
  }

  let release;
  try {
    release = await requestGitHub(
      `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`,
      token,
    );
    console.log(`[RELEASE] Found existing release: ${tag} (draft=${release.draft})`);
  } catch (err) {
    if (!err.message.includes('404')) {
      throw err;
    }
  }

  if (release) {
    if (release.draft) {
      console.log(`[RELEASE] Release ${tag} is draft. Converting to published release before upload...`);
      release = await requestGitHub(
        `https://api.github.com/repos/${owner}/${repo}/releases/${release.id}`,
        token,
        'PATCH',
        {
          draft: false,
        },
      );
      console.log(`[RELEASE] Release ${tag} is now published.`);
    }
    return release;
  }

  // Need to create a brand-new release (published) so electron-builder can attach assets
  let notes = getReleaseNotes(version);
  if (!notes) {
    console.log('[RELEASE] No CHANGELOG.md entry, using default release notes');
    notes = `Release ${version}`;
  }

  console.log(`[RELEASE] Creating published release: ${tag}`);
  release = await requestGitHub(
    `https://api.github.com/repos/${owner}/${repo}/releases`,
    token,
    'POST',
    {
      tag_name: tag,
      name: `v${version}`,
      draft: false,
      prerelease: false,
      body: notes,
    },
  );
  console.log(`[RELEASE] Created release: ${release.html_url}`);
  return release;
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

    // Step 4: Create git tag if doesn't exist
    const tag = `v${version}`;
    if (!tagExists(tag)) {
      createGitTag(version, `Release ${version}`);
    } else {
      console.log(`[GIT] Tag ${tag} already exists`);
    }

    // Step 5: Ensure release exists (published) before running electron-builder
    const token = process.env.GH_TOKEN;
    const {owner, repo} = getRepoInfo();
    await ensureRelease(owner, repo, tag, version, token);

    // Step 6: Build with electron-builder
    console.log('[BUILD] Building app...');
    run('pnpm', ['run', 'build'], env);

    // electron-builder will upload artifacts to the existing draft release
    const configArgs = ['--config', '.electron-builder.config.js', '--publish', 'always'];
    const platform = process.env.RELEASE_PLATFORM || process.platform;
    const arch = process.env.RELEASE_ARCH || process.arch;

    console.log(`[BUILD] Building app with electron-builder...`);
    console.log(`[BUILD] Platform: ${platform}, Arch: ${arch}`);

    if (platform === 'darwin') {
      const macArch = arch === 'arm64' ? '--arm64' : '--x64';
      run('electron-builder', ['--mac', macArch, ...configArgs], env);
      console.log(`[RELEASE] mac ${macArch} build finished.`);
      process.exit(0);
    }

    if (platform === 'win32') {
      const winArch = arch === 'arm64' ? '--arm64' : '--x64';
      run('electron-builder', ['--win', winArch, ...configArgs], env);
      console.log('[RELEASE] Windows build finished.');
      process.exit(0);
    }

    if (platform === 'linux') {
      run('electron-builder', ['--linux', ...configArgs], env);
      console.log('[RELEASE] Linux build finished.');
      process.exit(0);
    }

    throw new Error(`Unsupported platform: ${platform}`);
  } catch (err) {
    console.error('\n❌ Release failed:', err.message);
    process.exit(1);
  }
}

main();
