// Dedicated Next.js server for the browser suites. Better Auth calls are answered inside the browser
// (tests/browser-auth-fixture.cjs), so by default no backend is needed and nothing leaves the machine.
// QA_WITH_BACKEND=1 additionally mounts the real stack (Docker PostgreSQL + ../vortex-backend + local SMTP sink,
// see scripts/qa-stack.cjs) behind /api/auth/* and /api/v1/*. Full signup/verification flow: pnpm test:auth-e2e.
const { createServer } = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { startStack } = require('./qa-stack.cjs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let next, stack;
(async () => {
  const port = process.env.QA_FRONTEND_PORT || '3100';
  const base = `http://localhost:${port}`;
  // Never attach the suite to an unrelated process already listening on this port.
  const probe = createServer();
  probe.listen(Number(port)); await once(probe, 'listening');
  await new Promise(resolve => probe.close(resolve));
  const production = process.env.QA_PRODUCTION === '1';
  let backend = { AUTH_API_URL: 'http://127.0.0.1:9', FRONTEND_API_URL: '' };
  if (process.env.QA_WITH_BACKEND === '1') {
    stack = await startStack({ appPort: Number(port) });
    backend = { AUTH_API_URL: stack.apiUrl, FRONTEND_API_URL: stack.apiUrl + '/api/v1' };
  }
  const env = { ...process.env, NODE_ENV: production ? 'production' : 'development', VORTEX_BUILD_DIR: '.next-browser-qa', APP_ORIGIN: '', APP_URL: base, ...backend, TEST_BASE_URL: base };
  if (production) {
    const build = spawn(process.execPath, ['node_modules/next/dist/bin/next','build'], {env,stdio:'inherit'});
    const [code] = await once(build,'exit');
    if(code !== 0) throw Error('The isolated production build failed.');
  }
  next = spawn(process.execPath, ['node_modules/next/dist/bin/next', production ? 'start' : 'dev', '--port', port], { env, stdio: 'inherit' });
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (next.exitCode !== null) throw Error('Next.js stopped during startup.');
    try { const r = await fetch(`${base}/login`); if (r.ok) { ready = true; break; } } catch {}
    await delay(500);
  }
  if (!ready) throw Error('Next.js did not start on the dedicated QA port.');
  // Compile entry pages before the browser's short interaction deadlines start.
  for (const path of ['/demo', '/login', '/signup', '/forgot-password', '/invite/activate', '/stock', '/']) {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw Error(`QA page ${path} returned ${response.status}.`);
    await response.arrayBuffer();
  }
  const selected = process.argv.slice(2).filter(arg => arg !== '--');
  if (selected.some(file => !/^tests\/[a-z0-9-]+\.cjs$/.test(file))) throw Error('Pass only tests/*.cjs browser files.');
  const commands = selected.length ? selected.map(file => [process.execPath, [file]]) : [['pnpm', ['test:browser']]];
  for (const [executable, args] of commands) {
    const suite = spawn(executable, args, { env, stdio: 'inherit' });
    const [code] = await once(suite, 'exit');
    if (code !== 0) { process.exitCode = code ?? 1; break; }
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  if (next && next.exitCode === null) { next.kill('SIGTERM'); await once(next, 'exit'); }
  if (stack) stack.stop();
});
