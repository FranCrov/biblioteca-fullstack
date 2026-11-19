import { spawn, execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { access } from 'node:fs/promises';
import { createServer } from 'node:net';
import { devNull, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual as equal } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const host = '127.0.0.1', origin = `http://${host}:5173`;
const pipe = 'npipe:////./pipe/dockerDesktopLinuxEngine';
const legacy = 'biblioteca-demo', persistent = 'biblioteca-demo-local', volume = 'biblioteca-demo-data';
const tag = 'mongo:8.0', key = 'biblioteca.demo.owner', owner = 'biblioteca-fullstack-v1';
const bindings = { '27017/tcp': [{ HostIp: host, HostPort: '27028' }] };
const idPattern = /^[a-f0-9]{64}$/;

function requireMatch(ok, reason) {
  if (!ok) throw Error(`Refusing to run: ${reason}.`);
}

export function localEngine(env) {
  requireMatch(!env.DOCKER_HOST || env.DOCKER_HOST === pipe, 'unset DOCKER_HOST to use local Docker Desktop');
  return pipe; // Never resolve a context (including the current default) to a daemon.
}

function systemEnv(source) {
  return Object.fromEntries(Object.entries(source).filter(([k]) => /^(path|systemroot|windir|temp|tmp)$/i.test(k)));
}

export function demoEnvironment(source) {
  return { ...systemEnv(source), DOTENV_CONFIG_PATH: devNull, DOTENV_CONFIG_QUIET: 'true',
    BETTER_AUTH_TELEMETRY_DISABLED: '1', BETTER_AUTH_URL: origin,
    BETTER_AUTH_SECRET: randomBytes(32).toString('hex'), PORT: '3000', BIBLIOTECA_LOOPBACK_ONLY: '1',
    MONGODB_URI: `mongodb://${host}:27028/biblioteca_demo?directConnection=true` };
}

function dockerRunner() {
  const endpoint = localEngine(process.env), env = systemEnv(process.env);
  const config = join(tmpdir(), `biblioteca-no-config-${randomUUID()}`);
  return (...args) => {
    try {
      return execFileSync('docker.exe', ['--config', config, '--host', endpoint, ...args],
        { env, encoding: 'utf8', timeout: 15000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    } catch {
      throw Error(`Local Docker ${args.slice(0, 2).join(' ')} failed. Check Docker Desktop, the cached ${tag} image, and port 27028. No cleanup was attempted.`);
    }
  };
}

// Project only the metadata needed for ownership. Never request .Config.Env or a whole inspect.
function projection(fields) {
  return `{${Object.entries(fields).map(([k, v]) => `"${k}":{{json .${v}}}`).join(',')}}`;
}
const containerFormat = projection({ id: 'Id', name: 'Name', tag: 'Config.Image', image: 'Image',
  labels: 'Config.Labels', status: 'State.Status', autoRemove: 'HostConfig.AutoRemove', tmpfs: 'HostConfig.Tmpfs',
  binds: 'HostConfig.Binds', volumesFrom: 'HostConfig.VolumesFrom', mounts: 'Mounts',
  network: 'HostConfig.NetworkMode', publishAll: 'HostConfig.PublishAllPorts', bindings: 'HostConfig.PortBindings',
  ports: 'NetworkSettings.Ports' });
const volumeFormat = projection({ name: 'Name', driver: 'Driver', scope: 'Scope', options: 'Options', labels: 'Labels' });
const emptyList = x => x === null || equal(x, []);

function checkContainer(c, name, id, image) {
  const old = name === legacy;
  const common = c.name === `/${name}` && c.id === id && idPattern.test(id) && c.image === image && c.tag === tag
    && c.autoRemove === old && c.publishAll === false && ['bridge', 'default'].includes(c.network)
    && emptyList(c.binds) && emptyList(c.volumesFrom) && equal(c.bindings, bindings)
    && (c.status === 'running' ? equal(c.ports, bindings) : !old && ['exited', 'created'].includes(c.status));
  requireMatch(common, `${name} identity, state or port mapping differs from the local demo`);
  if (old) {
    requireMatch(equal(c.tmpfs, { '/data/db': '', '/data/configdb': '' }) && equal(c.mounts, []),
      `${name} is not the expected two-tmpfs demo`);
  } else {
    const m = c.mounts?.[0];
    requireMatch(c.labels?.[key] === owner && equal(c.tmpfs, { '/data/configdb': '' })
      && c.mounts.length === 1 && m.Type === 'volume' && m.Driver === 'local' && m.Name === volume
      && m.Destination === '/data/db' && m.RW === true, `${name} label or storage does not match`);
  }
}

function checkVolume(docker, expectedUser) {
  const disk = JSON.parse(docker('volume', 'inspect', '--format', volumeFormat, volume));
  requireMatch(disk.name === volume && disk.labels?.[key] === owner && disk.driver === 'local' && disk.scope === 'local'
    && (disk.options === null || equal(disk.options, {})), `${volume} is not an owned plain local volume`);
  requireMatch(docker('container', 'ls', '-aq', '--no-trunc', '--filter', `volume=${volume}`) === expectedUser,
    `${volume} has an unexpected container attachment`);
}

async function freePort(port) {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', () => reject(Error(`Port ${port} is unavailable on ${host}. Stop its owner yourself or use the existing demo.`)));
    server.listen({ host, port, exclusive: true }, () => server.close(resolve));
  });
}

export async function prepareMongo(docker, free = freePort) {
  await free(3000); await free(5173);
  requireMatch(docker('info', '--format', '{{.OSType}}') === 'linux', 'Docker Desktop must use the Linux engine');
  const image = docker('image', 'inspect', '--format', '{{.Id}}', tag);
  requireMatch(/^sha256:[a-f0-9]{64}$/.test(image), `${tag} must already be cached locally`);
  const find = name => docker('container', 'ls', '-aq', '--no-trunc', '--filter', `name=^/${name}$`);
  const old = find(legacy), current = find(persistent);
  requireMatch(!(old && current), 'both demo containers exist; will not choose a database');
  const name = old ? legacy : persistent;
  let id = old || current;
  const inspect = () => {
    requireMatch(idPattern.test(id), 'unexpected container ID');
    const c = JSON.parse(docker('container', 'inspect', '--format', containerFormat, id));
    checkContainer(c, name, id, image);
    if (name === persistent) checkVolume(docker, id);
    return c.status;
  };
  if (!id) {
    await free(27028);
    if (!docker('volume', 'ls', '-q', '--filter', `name=^${volume}$`)) {
      docker('volume', 'create', '--driver', 'local', '--label', `${key}=${owner}`, volume);
    }
    checkVolume(docker, '');
    id = docker('container', 'create', '--pull=never', '--name', name, '--network', 'bridge', '--label', `${key}=${owner}`,
      '--mount', `type=volume,source=${volume},target=/data/db`, '--tmpfs', '/data/configdb', '-p', `${host}:27028:27017/tcp`, tag);
  }
  if (inspect() !== 'running') {
    await free(27028);
    docker('container', 'start', id);
  }
  const verify = () => requireMatch(inspect() === 'running', `${name} is not running`);
  verify();
  return verify;
}

// Direct Node children (no npm/cmd/watch wrappers). The backend and Vite signal readiness over private IPC.
const backendGuard = `globalThis.fetch = async () => { throw Error('Outbound HTTP disabled for local demo'); };`;
const uiCode = `import {createServer} from 'vite';
  const ui = await createServer({ envFile:false, envDir:false, publicDir:false,
    server:{host:'127.0.0.1',port:5173,strictPort:true,cors:false,fs:{strict:true,allow:[process.cwd()]}} });
  process.once('disconnect', async () => { await ui.close(); process.exit(0); });
  await ui.listen(); process.send('ready');`;

function startChild(role, backendEnv) {
  const ui = role === 'ui', seed = role === 'seed';
  const env = ui ? systemEnv(process.env) : { ...backendEnv };
  if (seed) Object.assign(env, { ADMIN_EMAIL: 'admin@biblioteca.test', ADMIN_PASSWORD: 'BibliotecaDemo-Admin!',
    USER_EMAIL: 'user@biblioteca.test', USER_PASSWORD: 'BibliotecaDemo-User!' });
  const args = ui ? [] : ['--import', 'tsx'];
  const code = ui ? uiCode : `${backendGuard}\nawait import('${seed ? './scripts/seed-users.ts' : './src/server.ts'}');`;
  return nodeChild([...args, '--input-type=module', '--eval', code], join(root, ui ? 'frontend' : 'backend'), env);
}

export function nodeChild(args, cwd, env) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
  const ready = new Promise(resolve => child.once('message', m => { if (m === 'ready') resolve(); }));
  const done = new Promise((resolve, reject) => {
    child.once('error', reject); child.once('exit', (code, signal) => resolve(code ?? signal));
  });
  return { ready, done, async stop() {
    if (child.connected) child.disconnect();
    const fallback = setTimeout(() => child.kill(), 2500);
    try { await done; } finally { clearTimeout(fallback); }
  } };
}

export async function supervise(start, verify, signal) {
  const owned = [], failures = [];
  const cancelled = new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  const wait = promise => Promise.race([promise, cancelled, ...failures]);
  try {
    signal.throwIfAborted();
    await wait(verify());
    const seed = start('seed'); owned.push(seed);
    requireMatch(await wait(seed.done) === 0, 'seed did not complete; servers were not started');
    owned.pop();
    await wait(verify());
    for (const role of ['api', 'ui']) {
      const service = start(role); owned.push(service);
      failures.push(service.done.then(code => { throw Error(`${role} exited (${code})`); }));
      await wait(service.ready);
    }
    console.log(`Open ${origin} — press Ctrl+C to stop the app.`);
    await Promise.race([cancelled, ...failures]);
  } catch (err) {
    if (!signal.aborted) throw err;
  } finally {
    await Promise.all(owned.reverse().map(child => child.stop()));
  }
}

async function main(args) {
  if (args.length === 1 && args[0] === '--help') {
    console.log(`Usage: npm run dev [-- --help]\nStart the loopback-only Windows demo at ${origin}. Ctrl+C stops the app, not MongoDB.`);
    return;
  }
  requireMatch(!args.length, 'unknown arguments (see --help)');
  requireMatch(process.platform === 'win32', 'this launcher requires Windows Docker Desktop');
  const control = new AbortController();
  const stop = () => control.abort();
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  try {
    for (const file of ['backend/node_modules/tsx/dist/loader.mjs', 'frontend/node_modules/vite/dist/node/index.js']) {
      await access(join(root, file)).catch(() => { throw Error('Install backend and frontend dependencies first (see README).'); });
    }
    const docker = dockerRunner();
    const verify = await prepareMongo((...args) => {
      control.signal.throwIfAborted();
      return docker(...args);
    });
    const env = demoEnvironment(process.env);
    await supervise(role => startChild(role, env), async () => {
      await freePort(3000); await freePort(5173); verify();
    }, control.signal);
  } finally {
    process.off('SIGINT', stop); process.off('SIGTERM', stop);
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main(process.argv.slice(2)).catch(error => { console.error(`[demo] ${error.message}`); process.exitCode = 1; });
}
