import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { playbook } from '../../src/data/line-ai-sales-agent/playbook.js';
import { validatePlaybook } from '../../src/data/line-ai-sales-agent/schema.js';

const worktree = fileURLToPath(new URL('../..', import.meta.url));
const publicHtmlPath = `${worktree}/dist/app/line-ai-sales-agent.html`;

test('public Playbook content and compiled HTML contain no prohibited public labels or secrets', async () => {
  const validation = validatePlaybook(playbook);
  assert.equal(validation.valid, true, validation.errors.join('; '));

  const publicText = JSON.stringify(playbook);
  assert.doesNotMatch(publicText, /FutureSkill|Course Companion|Class Project|Certificate|คอร์ส|(?:^|\W)EP(?:$|\W)/i);
  assert.doesNotMatch(publicText, /\bsk-[A-Za-z0-9_-]+\b|Bearer\s+[A-Za-z0-9._-]+|Channel\s+(?:Access\s+Token|Secret)\s*:/i);
  assert.ok(playbook.troubleshooting.every((item) => item.checks.length > 0 && item.debugPromptContext));

  const html = await readFile(publicHtmlPath, 'utf8');
  assert.match(html, /<html[^>]+lang="th"/);
  assert.match(html, /LINE AI Sales Agent Playbook/);
  const cssFiles = (await readdir(`${worktree}/dist/_astro`)).filter((file) => file.endsWith('.css'));
  const css = (await Promise.all(cssFiles.map((file) => readFile(`${worktree}/dist/_astro/${file}`, 'utf8')))).join('\n');
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(html, /FutureSkill|Course Companion|Class Project|Certificate|คอร์ส|(?:^|\W)EP(?:$|\W)/i);
  assert.doesNotMatch(html, /\bsk-[A-Za-z0-9_-]+\b|Bearer\s+[A-Za-z0-9._-]+|Channel\s+(?:Access\s+Token|Secret)\s*:/i);
  assert.doesNotMatch(html, /TODO|FIXME|lorem ipsum|placeholder content/i);
});
