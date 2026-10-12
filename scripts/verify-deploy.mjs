// verify-deploy.mjs — post-push deploy oracle for punnattapatch.com (used by unlazy gates)
//
// Why: "push passed" ≠ "deployed". Cloudflare's `deployment list` shows Active before the
// build finishes (2026-09-30) and the edge once kept serving an old catalog.json after a
// deploy went Active (2026-09-06). Each subcommand reads the real thing and prints its
// success marker only after every assertion passes; anything else exits 1.
//
//   node scripts/verify-deploy.mjs stage marketing   # STAGE OK  — prod deployment = origin/main, stage deploy/success, rollback id logged
//   node scripts/verify-deploy.mjs stage app
//   node scripts/verify-deploy.mjs routes            # ROUTES OK — public 200 · /app/* 404 on marketing · app + pages.dev 302 to Access
//   node scripts/verify-deploy.mjs catalog           # CATALOG OK — live /catalog.json byte-equal to one generated from origin/main
//
// Options (negative controls only — gates never pass them): --commit <sha> · --wait <seconds>
// Token: $CLOUDFLARE_API_TOKEN → macOS Keychain (MacBook) → ~/.hermes/.env (mini). Never printed.
// Rollback ids are appended to .unlazy/deploy/rollback.log (gitignored).

import { execFileSync } from 'node:child_process';
import { readFileSync, appendFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || '327b9cb1702c5a0ec5a0016c1b6ddc77';
const PROJECTS = { marketing: 'punnattapatch-marketing', app: 'punnattapatch-app' };
const SITE = 'https://punnattapatch.com';

const [cmd, ...rest] = process.argv.slice(2);
const opt = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; };

function fail(msg) { console.error(`FAIL ${msg}`); process.exit(1); }
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function expectedCommit() {
  if (opt('--commit')) return git('rev-parse', opt('--commit'));
  git('fetch', '--quiet', 'origin', 'main');
  return git('rev-parse', 'origin/main');
}

function token() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  try {
    return execFileSync('security', ['find-generic-password', '-s', 'CLOUDFLARE_API_TOKEN', '-w'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { /* no Keychain (mini over ssh) */ }
  try {
    const m = readFileSync(join(homedir(), '.hermes/.env'), 'utf8').match(/^CLOUDFLARE_API_TOKEN=["']?([^"'\s]+)/m);
    if (m) return m[1];
  } catch { /* no env file */ }
  fail('no CLOUDFLARE_API_TOKEN (env · Keychain · ~/.hermes/.env)');
}

async function deployments(project, tok) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/pages/projects/${project}/deployments?env=production&per_page=15`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.success) fail(`${project}: Cloudflare API ${res.status} ${JSON.stringify(body.errors ?? '')}`);
  return body.result.sort((a, b) => b.created_on.localeCompare(a.created_on));
}

const isLive = (d) => d.latest_stage?.name === 'deploy' && d.latest_stage?.status === 'success';
const sha = (d) => d.deployment_trigger?.metadata?.commit_hash ?? '';

async function stage(which) {
  const project = PROJECTS[which] ?? fail(`unknown project "${which}" (marketing|app)`);
  const want = expectedCommit();
  const tok = token();
  const deadline = Date.now() + Number(opt('--wait') ?? 540) * 1000;

  for (;;) {
    const list = await deployments(project, tok);
    const dep = list.find((d) => sha(d) === want);
    if (dep) {
      const { name, status } = dep.latest_stage ?? {};
      if (status === 'failure' || status === 'canceled') fail(`${project} ${want.slice(0, 7)}: stage ${name} ${status} (deployment ${dep.id})`);
      if (isLive(dep)) {
        const live = list.filter(isLive);
        if (live[0].id !== dep.id) fail(`${project}: production serves ${live[0].id} (${sha(live[0]).slice(0, 7)}), not ${want.slice(0, 7)}`);
        const prev = live[1] ?? fail(`${project}: no earlier successful production deployment to roll back to`);
        const dir = join(ROOT, '.unlazy/deploy');
        mkdirSync(dir, { recursive: true });
        appendFileSync(join(dir, 'rollback.log'),
          [new Date().toISOString(), project, want.slice(0, 7), dep.id, prev.id, sha(prev).slice(0, 7)].join('\t') + '\n');
        console.log(`ROLLBACK ${project}: ${prev.id} (${sha(prev).slice(0, 7)})`);
        console.log(`STAGE OK ${project} ${want.slice(0, 7)} deployment=${dep.id}`);
        return;
      }
    }
    if (Date.now() > deadline) {
      fail(`${project} ${want.slice(0, 7)}: ${dep ? `still ${dep.latest_stage?.name}/${dep.latest_stage?.status}` : 'no deployment for this commit'} after wait`);
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }
}

async function routes() {
  // [url, status, Access redirect?] — `/` 200 is the positive control that makes the 404s meaningful
  const cases = [
    [`${SITE}/`, 200],
    [`${SITE}/app/dashboard`, 404],
    [`${SITE}/dashboard`, 404],
    ['https://punnattapatch-marketing.pages.dev/app/dashboard', 404],
    ['https://app.punnattapatch.com/app/dashboard', 302, true],
    ['https://app.punnattapatch.com/dashboard', 302, true],
    ['https://punnattapatch-app.pages.dev/', 302, true],
  ];
  const bad = [];
  for (const [url, want, access] of cases) {
    const res = await fetch(url, { redirect: 'manual' });
    const loc = res.headers.get('location') ?? '';
    const ok = res.status === want && (!access || new URL(loc, url).hostname.endsWith('.cloudflareaccess.com'));
    console.log(`${ok ? 'ok  ' : 'BAD '} ${res.status} (want ${want}${access ? ' → Access' : ''}) ${url}`);
    if (!ok) bad.push(url);
  }
  if (bad.length) fail(`${bad.length} route(s) leak or broke — if /app/* is 200 on marketing, purge cache and see wiki/debug-log.md 2026-09-03`);
  console.log(`ROUTES OK ${cases.length} checked`);
}

async function catalog() {
  const want = expectedCommit();
  const tmp = mkdtempSync(join(tmpdir(), 'verify-deploy-'));
  try {
    // Generate from origin/main sources exactly as the Cloudflare build does, not from this checkout
    const tar = execFileSync('git', ['archive', want, 'src/data', 'scripts/gen-catalog.mjs'], { cwd: ROOT });
    execFileSync('tar', ['-x', '-C', tmp], { input: tar });
    mkdirSync(join(tmp, 'public'));
    execFileSync(process.execPath, [join(tmp, 'scripts/gen-catalog.mjs')], { cwd: tmp, stdio: 'ignore' });
    const expected = readFileSync(join(tmp, 'public/catalog.json'), 'utf8');
    const res = await fetch(`${SITE}/catalog.json`); // no cache-buster: check what the edge actually serves
    const live = await res.text();
    if (res.status !== 200) fail(`catalog.json HTTP ${res.status}`);
    if (live !== expected) {
      try {
        const [l, e] = [JSON.parse(live), JSON.parse(expected)];
        const fields = Object.keys({ ...l, ...e }).filter((k) => JSON.stringify(l[k]) !== JSON.stringify(e[k]));
        const byKey = (c) => Object.fromEntries((c.packages ?? []).map((p) => [p.key, JSON.stringify(p)]));
        const [lp, ep] = [byKey(l), byKey(e)];
        const pkgs = Object.keys({ ...lp, ...ep }).filter((k) => lp[k] !== ep[k]);
        console.error(`differing fields: ${fields.join(' ')}`);
        console.error(`differing packages: ${pkgs.map((k) => `${k}${!lp[k] ? '(missing at edge)' : !ep[k] ? '(extra at edge)' : ''}`).join(' ') || '-'}`);
      } catch { console.error('live catalog.json is not valid JSON'); }
      fail(`catalog.json at the edge ≠ build of ${want.slice(0, 7)} — wait for deploy, else purge /catalog.json in Cloudflare`);
    }
    console.log(`CATALOG OK ${JSON.parse(live).packages.length} packages = ${want.slice(0, 7)}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const run = { stage: () => stage(rest[0]), routes, catalog }[cmd];
if (!run) { console.error('usage: verify-deploy.mjs stage <marketing|app> | routes | catalog'); process.exit(2); }
try {
  await run();
} catch (err) {
  // git/network/API errors → one clean line instead of a stack trace
  fail(String(err.stderr || err.message).trim().split('\n')[0]);
}
