import { consola } from 'consola';
import { spawn } from 'child_process';

const startTime = Date.now();

consola.box('Dofus Tools - Build');

consola.start('Building application...');

const build = spawn('pnpm', ['vite', 'build'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
});

let output = '';

build.stdout.on('data', (data) => {
  output += data.toString();
});

build.stderr.on('data', (data) => {
  output += data.toString();
});

build.on('close', (code) => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (code === 0) {
    consola.success(`Build completed in ${duration}s`);

    // Extraire les infos du build Vite
    const lines = output.split('\n').filter(line => line.includes('dist/') || line.includes('kB'));
    if (lines.length > 0) {
      console.log('');
      consola.info('Output:');
      lines.forEach(line => console.log('  ' + line.trim()));
    }

    console.log('');
    consola.box(`Ready to deploy`);
  } else {
    consola.error(`Build failed with code ${code}`);
    console.log(output);
    process.exit(code);
  }
});
