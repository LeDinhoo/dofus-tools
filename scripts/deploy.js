import { consola } from 'consola';
import { spawn } from 'child_process';

const startTime = Date.now();

// Configuration
const IMAGE_NAME = 'ghcr.io/ledinhoo/dofus-tools/dftools';
const VPS_HOST = process.env.VPS_HOST || '81.17.100.156';
const VPS_USER = process.env.VPS_USER || 'root';
const VPS_PATH = process.env.VPS_PATH || '/root/dofus-tools';
const TAG = process.argv[2] || 'latest';

consola.box('Dofus Tools - Deploy');

console.log('');
consola.info(`Image: ${IMAGE_NAME}:${TAG}`);
consola.info(`Target: ${VPS_USER}@${VPS_HOST}:${VPS_PATH}`);
console.log('');

async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
    });

    let output = '';
    if (options.silent) {
      proc.stdout?.on('data', (data) => { output += data.toString(); });
      proc.stderr?.on('data', (data) => { output += data.toString(); });
    }

    proc.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`Command failed with code ${code}\n${output}`));
    });
  });
}

async function deploy() {
  try {
    // Step 1: Setup builder
    consola.start('Setting up Docker buildx...');
    try {
      await run('docker', ['buildx', 'create', '--name', 'multiplatform', '--use'], { silent: true });
    } catch {
      await run('docker', ['buildx', 'use', 'multiplatform'], { silent: true });
    }
    consola.success('Docker buildx ready');

    // Step 2: Build & Push
    console.log('');
    consola.start('Building and pushing Docker image...');

    const buildArgs = [
      'buildx', 'build',
      '--platform', 'linux/amd64',
      '-t', `${IMAGE_NAME}:${TAG}`,
    ];

    if (TAG !== 'latest') {
      buildArgs.push('-t', `${IMAGE_NAME}:latest`);
    }

    buildArgs.push('--push', '.');

    await run('docker', buildArgs);
    consola.success('Image pushed successfully');

    if (TAG !== 'latest') {
      consola.info(`  → ${IMAGE_NAME}:${TAG}`);
      consola.info(`  → ${IMAGE_NAME}:latest`);
    } else {
      consola.info(`  → ${IMAGE_NAME}:latest`);
    }

    // Step 3: Deploy to VPS
    console.log('');
    consola.start(`Deploying to VPS...`);
    await run('ssh', [
      `${VPS_USER}@${VPS_HOST}`,
      `"cd ${VPS_PATH} && docker compose pull && docker compose up -d"`
    ]);
    consola.success('Deployed to VPS');

    // Done
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('');
    consola.box(`Deploy completed in ${duration}s`);

  } catch (error) {
    consola.error('Deployment failed');
    consola.error(error.message);
    process.exit(1);
  }
}

deploy();
