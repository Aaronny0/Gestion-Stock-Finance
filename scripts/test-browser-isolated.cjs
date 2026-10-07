const { createServer } = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { user } = require('../tests/browser-auth-fixture.cjs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let next, auth;
(async () => {
  // An ephemeral local Auth server; no request is sent to a user's Supabase project.
  auth = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization,apikey,content-type,x-client-info');
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'OPTIONS') { res.end(); return; }
    if (req.url === '/auth/v1/user') res.end(JSON.stringify(user));
    else { res.statusCode = 404; res.end('{}'); }
  });
  auth.listen(0, '127.0.0.1'); await once(auth, 'listening');
  const qaUrl = `http://127.0.0.1:${auth.address().port}`;
  const port = process.env.QA_FRONTEND_PORT || '3100';
  const base = `http://localhost:${port}`;
  // Never attach the suite to an unrelated process already listening on this port.
  const probe = createServer();
  probe.listen(Number(port)); await once(probe, 'listening');
  await new Promise(resolve => probe.close(resolve));
  const production = process.env.QA_PRODUCTION === '1';
  const env = { ...process.env, NODE_ENV: production ? 'production' : 'development', VORTEX_BUILD_DIR: '.next-browser-qa', NEXT_PUBLIC_SUPABASE_URL: qaUrl, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'qa-public-key', NEXT_PUBLIC_SUPABASE_ANON_KEY: '', FRONTEND_API_URL: '', QA_SUPABASE_URL: qaUrl, TEST_BASE_URL: base };
  if (production) {
    const build = spawn(process.execPath, ['node_modules/next/dist/bin/next','build'], {env,stdio:'inherit'});
    const [code] = await once(build,'exit');
    if(code !== 0) throw Error('The isolated production build failed.');
  }
  next = spawn(process.execPath, ['node_modules/next/dist/bin/next', production ? 'start' : 'dev', '--port', port], { env, stdio: 'inherit' });
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (next.exitCode !== null) throw Error('Next.js stopped during startup.');
    try { const r = await fetch(`${base}/api/auth`, { method: 'POST' }); if (r.status === 410) { ready = true; break; } } catch {}
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
  if (auth) auth.close();
});
