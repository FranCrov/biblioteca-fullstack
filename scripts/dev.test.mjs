import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareMongo, demoEnvironment, supervise, localEngine, nodeChild } from './dev.mjs';

const legacy = 'biblioteca-demo';
const persistent = 'biblioteca-demo-local';
const volume = 'biblioteca-demo-data';
const id = 'a'.repeat(64);
const image = `sha256:${'b'.repeat(64)}`;
const binding = { '27017/tcp': [{ HostIp: '127.0.0.1', HostPort: '27028' }] };
const label = { 'biblioteca.demo.owner': 'biblioteca-fullstack-v1' };
function container(name = legacy) {
  const old = name === legacy;
  return structuredClone({ id, name: `/${name}`, tag: 'mongo:8.0', image, status: 'running',
    autoRemove: old, tmpfs: old ? { '/data/db': '', '/data/configdb': '' } : { '/data/configdb': '' },
    mounts: old ? [] : [{ Type: 'volume', Name: volume, Driver: 'local', Destination: '/data/db', RW: true }],
    binds: null, volumesFrom: null, network: 'bridge', publishAll: false, bindings: binding,
    ports: binding, labels: old ? {} : label });
}

// Disposable Docker state machine. Unknown commands (including stop/rm/pull) fail the test.
function engine(c = container(), disk = null) {
  const writes = [], ports = [];
  const ownedDisk = { name: volume, driver: 'local', scope: 'local', options: null, labels: label };
  const docker = (...args) => {
    const [kind, op] = args, last = args.at(-1);
    if (kind === 'info') return 'linux';
    if (kind === 'image' && op === 'inspect') return image;
    if (kind === 'container' && op === 'ls') {
      if (last.startsWith('volume=')) return c?.name === `/${persistent}` ? id : '';
      return last === `name=^/${c?.name.slice(1)}$` ? id : '';
    }
    if (kind === 'container' && op === 'inspect' && last === id) return JSON.stringify(c);
    if (kind === 'volume' && op === 'ls') return disk ? volume : '';
    if (kind === 'volume' && op === 'inspect' && last === volume) return JSON.stringify(disk);
    if (kind === 'volume' && op === 'create') { writes.push('volume'); disk = ownedDisk; return volume; }
    if (kind === 'container' && op === 'create') {
      assert.ok(args.includes('--pull=never')); assert.ok(args.includes('127.0.0.1:27028:27017/tcp'));
      assert.ok(args.includes(`type=volume,source=${volume},target=/data/db`));
      writes.push('create'); c = container(persistent); c.status = 'created'; return id;
    }
    if (kind === 'container' && op === 'start' && last === id) { writes.push('start'); c.status = 'running'; return id; }
    assert.fail(`Unexpected docker command: ${args.join(' ')}`);
  };
  return { docker, writes, ports, free: async p => { ports.push(p); } };
}

test('verified running tmpfs demo is reused without Docker mutations', async () => {
  const e = engine(); await prepareMongo(e.docker, e.free);
  assert.deepEqual(e.writes, []); assert.deepEqual(e.ports, [3000, 5173]);
});

test('new demo creates owned storage once; repeat run is read-only', async () => {
  const e = engine(null); await prepareMongo(e.docker, e.free);
  assert.deepEqual(e.writes, ['volume', 'create', 'start']);
  assert.ok(e.ports.includes(27028)); e.writes.length = 0;
  await prepareMongo(e.docker, e.free); assert.deepEqual(e.writes, []);
});

for (const [field, value] of Object.entries({ tag: 'mongo:latest', image: 'other', binds: ['/host:/data/db'],
  mounts: [{}], volumesFrom: ['unrelated'], tmpfs: { '/data/db': '' }, status: 'paused',
  autoRemove: false, network: 'host', publishAll: true, bindings: {},
  ports: { '27017/tcp': [...binding['27017/tcp'], { HostIp: '0.0.0.0', HostPort: '27028' }] } })) {
  test(`legacy ${field} mismatch refuses reuse without mutation`, async () => {
    const e = engine({ ...container(), [field]: value });
    await assert.rejects(prepareMongo(e.docker, e.free), /refus/i); assert.deepEqual(e.writes, []);
  });
}

test('unowned or externally backed storage is not adopted', async () => {
  for (const disk of [{ labels: {} }, { driver: 'local', labels: label, options: { device: '/shared' } }]) {
    const e = engine(null, { name: volume, scope: 'local', ...disk });
    await assert.rejects(prepareMongo(e.docker, e.free), /volume/i); assert.deepEqual(e.writes, []);
  }
});

test('does not start a stopped persistent container with a foreign label or shared volume', async () => {
  for (const shared of [false, true]) {
    const c = container(persistent); c.status = 'exited'; c.ports = {};
    if (!shared) c.labels = {};
    const e = engine(c, { name: volume, scope: 'local', driver: 'local', options: {}, labels: label });
    const docker = (...args) => args.at(-1) === `volume=${volume}` ? `${id}\nforeign` : e.docker(...args);
    await assert.rejects(prepareMongo(docker, e.free), /refusing/i); assert.deepEqual(e.writes, []);
  }
});

test('occupied ports prevent all Docker writes', async () => {
  for (const busy of [3000, 5173, 27028]) {
    const e = engine(null); await assert.rejects(prepareMongo(e.docker, async p => {
      if (p === busy) throw Error(`Port ${p} is busy`);
    }), /busy/); assert.deepEqual(e.writes, []);
  }
});

test('never targets a remote engine or inherits application credentials', () => {
  assert.throws(() => localEngine({ DOCKER_HOST: 'tcp://remote:2375' }), /DOCKER_HOST/);
  assert.match(localEngine({}), /^npipe:.*dockerDesktopLinuxEngine$/);
  const env = demoEnvironment({ PATH: 'tools', MONGODB_URI: 'remote', GITHUB_CLIENT_ID: 'private', NODE_OPTIONS: 'unsafe' });
  assert.equal(env.PATH, 'tools'); assert.equal(env.GITHUB_CLIENT_ID, undefined); assert.equal(env.NODE_OPTIONS, undefined);
  assert.match(env.MONGODB_URI, /^mongodb:\/\/127\.0\.0\.1:27028\/biblioteca_demo\?directConnection=true$/);
});

test('only owned children are stopped on cancellation or service failure', async () => {
  for (const cancel of [true, false]) {
    const control = new AbortController(), events = [];
    const start = role => {
      events.push(role);
      const { promise: done, resolve } = Promise.withResolvers();
      if (role === 'seed') resolve(0);
      if (role === 'ui') setImmediate(() => cancel ? control.abort() : resolve(1));
      return { ready: Promise.resolve(), done, stop: () => { events.push(`close ${role}`); resolve(0); } };
    };
    const launch = supervise(start, async () => events.push('verify'), control.signal);
    if (cancel) await launch; else await assert.rejects(launch, /ui/);
    assert.deepEqual(events, ['verify', 'seed', 'verify', 'api', 'ui', 'close ui', 'close api']);
  }
});

test('seed rejection or changed database identity prevents server startup', async () => {
  for (const seedCode of [0, 1]) {
    let checks = 0; const roles = [];
    const verify = () => { if (++checks === 2) throw Error('identity changed'); };
    await assert.rejects(supervise(role => {
      roles.push(role); return { done: Promise.resolve(seedCode), stop() {} };
    }, verify, new AbortController().signal), seedCode ? /seed/ : /identity changed/);
    assert.deepEqual(roles, ['seed']);
  }
});

test('owned Node worker signals readiness and exits via IPC cleanup', { timeout: 10000 }, async () => {
  // No files, Docker, application code, or listening sockets in this harness.
  const { SystemRoot, TEMP } = process.env;
  const worker = nodeChild(['--eval', "process.once('disconnect', () => process.exit(0)); process.send('ready')"], process.cwd(), { SystemRoot, TEMP });
  try { await Promise.race([worker.ready, worker.done.then(() => assert.fail('exited before ready'))]); }
  finally { await worker.stop(); }
  assert.equal(await worker.done, 0);
});
