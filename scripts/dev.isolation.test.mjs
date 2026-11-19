import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { devNull } from 'node:os';
import { fileURLToPath } from 'node:url';
import { localEngine, demoEnvironment, prepareMongo, nodeChild } from './dev.mjs';

const ID = 'a'.repeat(64);
const IMG = `sha256:${'b'.repeat(64)}`;
const V = 'biblioteca-demo-data';
const P = 'biblioteca-demo-local';
const L = { 'biblioteca.demo.owner': 'biblioteca-fullstack-v1' };
const B = { '27017/tcp': [{ HostIp: '127.0.0.1', HostPort: '27028' }] };

function container(name = 'biblioteca-demo', overrides = {}) {
  const legacy = name === 'biblioteca-demo';
  return {
    id: ID,
    name: `/${name}`,
    tag: 'mongo:8.0',
    image: IMG,
    status: 'running',
    autoRemove: legacy,
    tmpfs: legacy ? { '/data/db': '', '/data/configdb': '' } : { '/data/configdb': '' },
    mounts: legacy ? [] : [{ Type: 'volume', Name: V, Driver: 'local', Destination: '/data/db', RW: true }],
    binds: null,
    volumesFrom: null,
    network: 'bridge',
    publishAll: false,
    bindings: B,
    ports: B,
    labels: legacy ? {} : L,
    ...overrides
  };
}

function engine(c = null, disk = null, attached = '') {
  const calls = [];
  const docker = (...args) => {
    calls.push(args.join(' '));
    const [kind, operation] = args;
    const last = args.at(-1);
    if (kind === 'info') return 'linux';
    if (kind === 'image') return IMG;
    if (kind === 'container' && operation === 'ls') {
      if (last.startsWith('volume=')) return attached;
      const match = last.match(/^name=\^\/(.+)\$$/);
      return match && c?.name === `/${match[1]}` ? ID : '';
    }
    if (kind === 'container' && operation === 'inspect') return JSON.stringify(c);
    if (kind === 'volume' && operation === 'ls') return disk ? V : '';
    if (kind === 'volume' && operation === 'inspect') return JSON.stringify(disk);
    if (kind === 'volume' && operation === 'create') {
      disk = { name: V, driver: 'local', scope: 'local', options: null, labels: L };
      return V;
    }
    if (kind === 'container' && operation === 'create') {
      c = container(P, { status: 'created' });
      attached = ID;
      return ID;
    }
    if (kind === 'container' && operation === 'start') {
      if (c) c.status = 'running';
      return ID;
    }
    throw Error(`unexpected ${args.join(' ')}`);
  };
  return {
    docker,
    calls,
    mutations: () => calls.filter((call) => /\s(create|start|stop|rm|pull)\b/.test(call)),
    free: async () => {}
  };
}

test('S5 remote engine rejected with exact text', () => {
  assert.throws(
    () => localEngine({ DOCKER_HOST: 'tcp://remote:2375' }),
    (error) => error.message === 'Refusing to run: unset DOCKER_HOST to use local Docker Desktop.'
  );
});

test('S5 unknown args exit 1 before Docker', () => {
  const result = spawnSync(process.execPath, ['scripts/dev.mjs', '--bogus'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    encoding: 'utf8'
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown arguments/);
});

test('S2 no inherited secrets and loopback env', () => {
  const env = demoEnvironment({
    PATH: 'tools',
    GITHUB_CLIENT_ID: 'x',
    NODE_OPTIONS: '--require x',
    MONGODB_URI: 'mongodb+srv://atlas/x'
  });
  assert.equal(env.PATH, 'tools');
  for (const key of ['GITHUB_CLIENT_ID', 'NODE_OPTIONS']) assert.ok(!(key in env));
  assert.equal(env.MONGODB_URI, 'mongodb://127.0.0.1:27028/biblioteca_demo?directConnection=true');
  assert.equal(env.DOTENV_CONFIG_PATH, devNull);
  assert.match(env.BETTER_AUTH_SECRET, /^[a-f0-9]{64}$/);
});

test('S2 foreign volume attachment refuses before writes', async () => {
  const harness = engine(
    container(P),
    { name: V, driver: 'local', scope: 'local', options: null, labels: L },
    `${ID}\nforeign`
  );
  await assert.rejects(prepareMongo(harness.docker, harness.free), /attachment/);
  assert.deepEqual(harness.mutations(), []);
});

test('S2 fresh demo uses pull=never and loopback bind', async () => {
  const harness = engine();
  await prepareMongo(harness.docker, harness.free);
  assert.equal(harness.mutations().length, 3);
  assert.ok(
    harness.calls.some(
      (call) => call.includes('--pull=never') && call.includes('127.0.0.1:27028:27017/tcp')
    )
  );
});

test('S2 stubborn child force-killed after IPC fallback', { timeout: 8000 }, async () => {
  const worker = nodeChild(
    ['--eval', "process.on('disconnect',()=>{});process.send('ready');setInterval(()=>{},1000)"],
    process.cwd(),
    {}
  );
  await Promise.race([worker.ready, worker.done.then(() => assert.fail('early exit'))]);
  await worker.stop();
  assert.notEqual(await worker.done, 0);
});
