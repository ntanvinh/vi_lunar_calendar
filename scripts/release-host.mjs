import {spawnSync} from 'child_process';

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
  process.exit(0);
}

if (platform === 'win32') {
  const winArch = arch === 'arm64' ? '--arm64' : '--x64';
  run('electron-builder', ['--win', winArch, ...configArgs], env);
  process.exit(0);
}

if (platform === 'linux') {
  run('electron-builder', ['--linux', ...configArgs], env);
  process.exit(0);
}

process.exit(1);
