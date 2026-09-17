#!/usr/bin/env node
// Deterministically bundle validate-cli.ts + logic.ts into the Mac mini validator.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../..');
const source = join(here, 'logic.ts');
const entry = join(here, 'validate-cli.ts');
const output = resolve(process.argv[2] || process.env.CHAT_CENTER_VALIDATOR_OUT || join(process.env.HOME || '', 'Documents/claude-code-pun-nattapatch/mac-mini-ops/line-relay/validate-snippet.mjs'));
const astroEntry = fileURLToPath(import.meta.resolve('astro'));
const astroDir = astroEntry.slice(0, astroEntry.lastIndexOf('/astro/') + '/astro'.length);
const esbuild = join(dirname(astroDir), 'esbuild/bin/esbuild');

if (!existsSync(esbuild)) throw new Error(`esbuild binary not found at ${esbuild}; run pnpm install --frozen-lockfile`);
const sourceHash = createHash('sha256').update(readFileSync(source)).digest('hex');
const built = spawnSync(esbuild, [entry, '--bundle', '--platform=node', '--format=esm', '--target=node22', `--outfile=${output}`, `--banner:js=#!/usr/bin/env node\n// generated-from-logic-sha256: ${sourceHash}`], { cwd: repo, encoding: 'utf8' });
if (built.status !== 0) {
  process.stderr.write(built.stderr || built.stdout);
  process.exit(built.status ?? 1);
}
console.log(`generated ${output}`);

// ก้อนที่สอง: logic เปล่าๆ ให้ pull-brain.mjs import renderTokens ไปใช้ตอน publish
// แยกจาก CLI เพราะ CLI มี top-level await ที่จะรันทันทีเมื่อถูก import
const libOut = join(dirname(output), 'chat-logic.mjs');
const lib = spawnSync(esbuild, [source, '--bundle', '--platform=node', '--format=esm', '--target=node22', `--outfile=${libOut}`, `--banner:js=// generated-from-logic-sha256: ${sourceHash}`], { cwd: repo, encoding: 'utf8' });
if (lib.status !== 0) {
  process.stderr.write(lib.stderr || lib.stdout);
  process.exit(lib.status ?? 1);
}
console.log(`generated ${libOut}`);
console.log(`logic.ts sha256 ${sourceHash}`);
