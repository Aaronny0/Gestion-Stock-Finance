// Isolated QA stack: PostgreSQL (Docker) + migrated vortex-backend (Better Auth) + local SMTP sink.
// Nothing leaves the machine: generated secrets, example.test recipients only, containers removed on stop.
const net = require('node:net');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Minimal SMTP receiver (no dependency). Messages are decoded (quoted-printable) and pushed to `mails`. */
function startSmtpSink(mails) {
  const server = net.createServer(socket => {
    let data = false, body = '', buffer = '';
    const reply = text => socket.write(text + '\r\n');
    reply('220 qa.example.test ESMTP');
    socket.on('data', chunk => {
      buffer += chunk.toString('utf8');
      let index;
      while ((index = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, index); buffer = buffer.slice(index + 2);
        if (data) {
          if (line === '.') { data = false; mails.push(body.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))); body = ''; reply('250 queued'); }
          else body += (line.startsWith('..') ? line.slice(1) : line) + '\n';
        } else if (/^EHLO/i.test(line)) reply('250 qa.example.test');
        else if (/^HELO/i.test(line)) reply('250 qa.example.test');
        else if (/^RCPT TO/i.test(line)) reply(/@example\.test>?$/i.test(line.trim()) ? '250 ok' : '550 fixture recipients only');
        else if (/^DATA/i.test(line)) { data = true; reply('354 end with <CRLF>.<CRLF>'); }
        else if (/^QUIT/i.test(line)) { reply('221 bye'); socket.end(); }
        else reply('250 ok');
      }
    });
    socket.on('error', () => {});
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/**
 * Starts the stack and resolves to { apiUrl, appUrl, mails, waitForMail(), stop() }.
 * appUrl is the public URL of the Next.js app under test (APP_URL of the backend, so cookies and origins match).
 */
async function startStack({ appPort, adminUrl = 'https://admin.example.test', backendDir = process.env.VORTEX_BACKEND_DIR || path.resolve(__dirname, '../../vortex-backend') }) {
  const name = 'vortex-front-qa-' + randomBytes(3).toString('hex');
  const pgPort = 57000 + Math.floor(Math.random() * 500), apiPort = 3600 + Math.floor(Math.random() * 300);
  const dbPassword = randomBytes(16).toString('hex'), runtime = randomBytes(32).toString('hex');
  const appUrl = `http://${process.env.QA_HOST || 'localhost'}:${appPort}`;
  const mails = [];
  const smtp = await startSmtpSink(mails);
  let apiName;
  const stop = () => { for (const container of [apiName, name]) if (container) try { execFileSync('docker', ['rm', '-f', container], { stdio: 'ignore' }); } catch {} smtp.close(); };
  try {
    execFileSync('docker', ['run', '-d', '--name', name, '-e', 'POSTGRES_PASSWORD=' + dbPassword, '-e', 'POSTGRES_DB=vortex', '-p', `127.0.0.1:${pgPort}:5432`, 'postgres:17.6-bookworm'], { stdio: 'ignore' });
    for (let i = 0; ; i++) {
      try { execFileSync('docker', ['exec', name, 'pg_isready', '-U', 'postgres', '-d', 'vortex'], { stdio: 'ignore' }); await delay(1500); break; }
      catch { if (i > 60) throw new Error('PostgreSQL did not start.'); await delay(1000); }
    }
    const direct = `postgresql://postgres:${dbPassword}@127.0.0.1:${pgPort}/vortex`;
    const identity = randomBytes(32).toString('hex');
    // The backend runs on Bun: use the official image with the backend checkout mounted (installed with `bun install`).
    const bun = (extra, command) => ['run', ...extra, '--network', 'host', '--user', `${process.getuid()}:${process.getgid()}`, '-e', 'HOME=/tmp', '-v', `${backendDir}:/app`, '-w', '/app', 'oven/bun:1', ...command];
    // The Docker entrypoint restarts PostgreSQL once after initialisation: retry the migration briefly.
    for (let i = 0; ; i++) {
      try { execFileSync('docker', bun(['--rm', '-e', 'DIRECT_DATABASE_URL=' + direct, '-e', 'RUNTIME_DB_PASSWORD=' + runtime, '-e', 'IDENTITY_DB_PASSWORD=' + identity], ['bun', 'deploy/scripts/migrate.mjs']), { stdio: 'ignore' }); break; }
      catch { if (i > 5) throw new Error('Backend migration failed (is ' + backendDir + ' installed with bun install and prisma generate?).'); await delay(2000); }
    }
    const env = {
      NODE_ENV: 'production', PORT: String(apiPort),
      APP_DATABASE_URL: `postgresql://vortex_app_login:${runtime}@127.0.0.1:${pgPort}/vortex`,
      IDENTITY_DATABASE_URL: `postgresql://vortex_identity_login:${identity}@127.0.0.1:${pgPort}/vortex`,
      APP_URL: appUrl, ADMIN_ORIGINS: adminUrl + ',' + appUrl, ADMIN_ALLOWED_MAIL: 'admin@example.test',
      BETTER_AUTH_SECRET: randomBytes(32).toString('hex'),
      SMTP_HOST: '127.0.0.1', SMTP_PORT: String(smtp.address().port), SMTP_SECURE: 'false', SMTP_REQUIRE_TLS: 'false', MAIL_FROM: 'Vortex <noreply@example.test>',
    };
    apiName = name + '-api';
    execFileSync('docker', bun(['-d', '--name', apiName, ...Object.entries(env).flatMap(([key, value]) => ['-e', `${key}=${value}`])], ['bun', 'src/main.ts']), { stdio: 'ignore' });
    const apiUrl = `http://127.0.0.1:${apiPort}`;
    for (let i = 0; ; i++) {
      try { if (execFileSync('docker', ['inspect', '-f', '{{.State.Running}}', apiName]).toString().trim() !== 'true') throw new Error('The backend stopped during startup.'); } catch (error) { if (/stopped/.test(String(error))) throw error; }
      try { if ((await fetch(apiUrl + '/api/v1/health')).ok) break; } catch {}
      if (i > 60) throw new Error('The backend did not become healthy.');
      await delay(500);
    }
    const waitForMail = async () => { for (let i = 0; i < 50 && !mails.length; i++) await delay(100); if (!mails.length) throw new Error('No mail received.'); return mails.shift(); };
    return { apiUrl, appUrl, mails, waitForMail, stop };
  } catch (error) { stop(); throw error; }
}
module.exports = { startStack };
