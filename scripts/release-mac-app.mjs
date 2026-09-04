import {spawnSync} from 'child_process';
import {existsSync, mkdirSync, readdirSync, rmSync} from 'fs';
import os from 'os';
import path from 'path';

const projectRoot = process.cwd();
const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
const appName = 'VLunar Calendar.app';
const outputDir = path.join(projectRoot, 'dist');
const applicationsDir = path.join(os.homedir(), 'Applications');
const installPath = path.join(applicationsDir, appName);

function run(command, args, env = process.env) {
  console.log(`[MAC APP] Running: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}`);
  }
}

function findBuiltApp() {
  if (!existsSync(outputDir)) {
    return null;
  }

  const candidates = readdirSync(outputDir, {withFileTypes: true})
    .filter(entry => entry.isDirectory() && entry.name.startsWith('mac'))
    .map(entry => path.join(outputDir, entry.name, appName));

  return candidates.find(existsSync) || null;
}

if (process.platform !== 'darwin') {
  throw new Error('release:mac:app chỉ chạy trên macOS.');
}

try {
  console.log(`[MAC APP] Building signed macOS app for ${arch}...`);
  const buildEnv = {
    ...process.env,
    MODE: 'production',
  };

  run('pnpm', ['run', 'build'], buildEnv);
  run(
    'pnpm',
    [
      'exec',
      'electron-builder',
      '--mac',
      `--${arch}`,
      '--config',
      '.electron-builder.config.js',
      '--dir',
    ],
    buildEnv,
  );

  const builtAppPath = findBuiltApp();
  if (!builtAppPath) {
    throw new Error(`Không tìm thấy ${appName} trong dist sau khi build.`);
  }

  console.log('[MAC APP] Verifying code signature...');
  run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', builtAppPath]);

  mkdirSync(applicationsDir, {recursive: true});
  rmSync(installPath, {recursive: true, force: true});
  run('ditto', ['--rsrc', '--extattr', '--acl', builtAppPath, installPath]);

  console.log('[MAC APP] Verifying installed app signature...');
  run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', installPath]);

  console.log(`[MAC APP] Installed: ${installPath}`);

  const launchEnv = {...process.env};
  delete launchEnv.ELECTRON_RUN_AS_NODE;
  delete launchEnv.ELECTRON_FORCE_IS_PACKAGED;
  run('open', [installPath], launchEnv);
} catch (error) {
  console.error('\n[MAC APP] Release failed:', error.message);
  process.exit(1);
}
