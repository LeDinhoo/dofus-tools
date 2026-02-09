import { consola } from 'consola';
import { spawn } from 'child_process';

const startTime = Date.now();
const IMAGE_NAME = 'ghcr.io/ledinhoo/dofus-tools/dftools';
const push = process.argv.includes('--push');

consola.box(`Docker ${push ? 'Build & Push' : 'Build'}`);

console.log('');
consola.info(`Image: ${IMAGE_NAME}:latest`);
consola.info(`Platform: linux/amd64`);
console.log('');

async function run(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

async function build() {
  try {
    // Setup builder
    consola.start('Setting up Docker buildx...');
    try {
      await run('docker', ['buildx', 'create', '--name', 'multiplatform', '--use']);
    } catch {
      await run('docker', ['buildx', 'use', 'multiplatform']);
    }

    // Build
    console.log('');
    consola.start(push ? 'Building and pushing image...' : 'Building image...');

    const args = [
      'buildx', 'build',
      '--progress=plain',
      '--platform', 'linux/amd64',
      '-t', `${IMAGE_NAME}:latest`,
      // Cache layers sur le registry GitHub (accélère les rebuilds)
      '--cache-from', `type=registry,ref=${IMAGE_NAME}:buildcache`,
    ];

    if (push) {
      args.push('--cache-to', `type=registry,ref=${IMAGE_NAME}:buildcache,mode=max`);
      args.push('--push');
    }
    args.push('.');

    await run('docker', args);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('');
    consola.success(`${push ? 'Build & Push' : 'Build'} completed in ${duration}s`);
    consola.box(`${IMAGE_NAME}:latest`);

  } catch (error) {
    consola.error('Build failed');
    process.exit(1);
  }
}

build();
