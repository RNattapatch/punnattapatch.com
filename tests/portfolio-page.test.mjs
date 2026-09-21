import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const pagePath = resolve(root, 'src/pages/portfolio.astro');
const dataPath = resolve(root, 'src/data/portfolio.json');

test('portfolio route renders from the synced evidence source', () => {
  assert.equal(existsSync(pagePath), true, 'src/pages/portfolio.astro must exist');
  assert.equal(existsSync(dataPath), true, 'src/data/portfolio.json must exist');
  const page = readFileSync(pagePath, 'utf8');
  assert.match(page, /import portfolio from '..\/data\/portfolio\.json'/);
  assert.match(page, /BaseLayout/);
  assert.match(page, /\/booking/);
  assert.match(page, /\/services/);
  const footer = readFileSync(resolve(root, 'src/components/Footer.astro'), 'utf8');
  assert.match(footer, /href="\/portfolio"/);
});

test('synced web data keeps the confirmed claims and exclusions', () => {
  assert.equal(existsSync(dataPath), true, 'src/data/portfolio.json must exist');
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  const publicText = JSON.stringify(data.public);

  assert.equal(data.featured.nissan.audienceCount, '300+');
  assert.equal(data.featured.scenery.audienceCount, '30+');
  assert.equal(data.featured.hfc.audienceCount, '100+');
  assert.equal(data.futureskill.courseUrl, 'https://futureskill.co/course/detail/6030');
  for (const forbidden of ['M2Homecar', 'รามคำแหง', 'TNI', 'วิทยาลัยเทคโนโลยีชลบุรี', 'Good & Rich']) {
    assert.equal(publicText.includes(forbidden), false, `web public content must exclude ${forbidden}`);
  }
});
