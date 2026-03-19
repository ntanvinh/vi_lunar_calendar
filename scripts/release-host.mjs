import {spawnSync} from 'child_process';
import {createInterface} from 'readline';
import {readFileSync} from 'fs';

function run(command, args, env) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function parsePackageVersion() {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
  return packageJson.version;
}

async function requestGitHub(url, token, method = 'GET', body) {
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

async function publishReleaseFromDraft() {
  if (process.env.SKIP_RELEASE_PUBLISH === '1') {
    return;
  }

  if (!process.stdin.isTTY) {
    console.log('Bỏ qua bước publish release vì không phải môi trường interactive.');
    return;
  }

  const token = process.env.GH_TOKEN;
  if (!token) {
    console.log('Không tìm thấy GH_TOKEN, bỏ qua bước publish release.');
    return;
  }

  const owner = process.env.RELEASE_GITHUB_OWNER || 'ntanvinh';
  const repo = process.env.RELEASE_GITHUB_REPO || 'vi_lunar_calendar_releases';
  const version = parsePackageVersion();
  const tag = `v${version}`;
  const notes = await promptReleaseNotes(version);

  if (!notes) {
    throw new Error('Release notes không được để trống.');
  }

  const release = await requestGitHub(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`, token);
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

  console.log(`\nĐã publish release: ${updatedRelease.html_url}`);
}

const env = {
  ...process.env,
  MODE: 'production',
};

run('pnpm', ['run', 'build'], env);

const configArgs = ['--config', '.electron-builder.config.js', '--publish', 'always'];
const platform = process.platform;
const arch = process.arch;

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

process.exit(1);
