// Against a built app preview: FRAMEWISE_URL=https://127.0.0.1:8790/framewise node tests/framewise-smoke.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const url = process.env.FRAMEWISE_URL ?? 'https://127.0.0.1:8790/framewise';
const output = process.env.FRAMEWISE_SCREENSHOTS;
const images = new URL('../src/assets/framewise/', import.meta.url);

for (const engine of [chromium, webkit]) {
  const chrome = engine === chromium;
  const browser = await engine.launch(chrome ? {args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']} : {});
  try {
    const context = await browser.newContext({
      viewport: chrome ? {width:1440,height:960} : {width:390,height:844},
      isMobile: !chrome,
      hasTouch: !chrome,
      permissions: chrome ? ['camera'] : [],
      acceptDownloads: true,
      ignoreHTTPSErrors: new URL(url).hostname === '127.0.0.1',
    });
    const page = await context.newPage();
    const errors = [];
    const writes = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => { if (request.method() !== 'GET') writes.push(request.method()); });
    const response = await page.goto(url);
    assert.equal(response.status(), 200);
    assert.match(response.headers()['permissions-policy'] ?? '', /camera=\(self\)/);
    assert.match(response.headers()['content-security-policy'] ?? '', /wasm-unsafe-eval/);
    assert.equal(await page.locator('#recommendations article').count(), 3);
    assert.equal(await page.locator('#recommendations [data-pose]').first().getAttribute('data-pose'), 'window-seat');
    await page.evaluate(() => document.fonts.ready);
    if (output) await page.screenshot({path:`${output}/framewise-${engine.name()}.png`,fullPage:true});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    const firstPhoto = await page.locator('#recommendations img').first().getAttribute('src');
    await page.locator('#studio [data-profile=women]').click();
    assert.notEqual(await page.locator('#recommendations img').first().getAttribute('src'), firstPhoto);
    await page.locator('[data-sample=street]').click();
    await page.locator('[data-mood=street]').click();
    assert.match(await page.locator('#result-context').textContent(), /ถนน.*สตรีต/);
    await page.locator('#recommendations [data-pose]').first().click();
    await page.locator('#pose-dialog').waitFor();
    assert.ok((await page.locator('#subject-cue').textContent()).length > 20);
    assert.ok((await page.locator('#camera-cue').textContent()).length > 20);
    await page.locator('#save-pose').click();
    const id = await page.evaluate(() => JSON.parse(localStorage.getItem('framewise:saved-poses:v1'))[0]);
    assert.ok(id);
    await page.getByRole('button',{name:'ปิดรายละเอียด'}).click();
    await page.reload();
    await page.locator('#library-tab').click();
    await page.locator('[data-filter=saved]').click();
    assert.equal(await page.locator('#library-grid [data-pose]').first().getAttribute('data-pose'), id);
    await page.locator('#studio-tab').click();

    for (const [fixture, scene] of [['cafe','cafe'], ['street','street'], ['beach','beach']]) {
      const previous = await page.locator('#scene-image').getAttribute('src');
      await page.locator('#scene-file').setInputFiles({name:`${fixture}.webp`,mimeType:'image/webp',buffer:await readFile(new URL(`${fixture}.webp`,images))});
      await page.waitForFunction(oldSource => {
        const badge = document.querySelector('#scene-badge').textContent;
        return document.querySelector('#scene-image').getAttribute('src') !== oldSource
          && (badge.includes('ฉากที่แอปคาดไว้') || badge.includes('เลือกประเภทฉากได้'));
      }, previous, {timeout:45_000});
      assert.equal(await page.locator('#scene-select').inputValue(), scene, `${engine.name()} ${fixture}: ${await page.locator('#scene-status').textContent()}`);
    }
    await page.locator('#scene-select').selectOption('interior');
    assert.match(await page.locator('#scene-badge').textContent(), /ฉากที่คุณเลือก/);
    await page.locator('#scene-file').setInputFiles({name:'bad.jpg',mimeType:'image/jpeg',buffer:Buffer.from('broken file')});
    await page.waitForFunction(() => document.querySelector('#scene-status').textContent.includes('JPEG'));
    assert.equal(await page.locator('#scene-select').inputValue(), 'interior');

    if (chrome) {
      await page.locator('#camera-scene').click();
      await page.waitForFunction(() => !document.querySelector('#shutter').disabled);
      const uploaded = await page.locator('#scene-image').getAttribute('src');
      await page.getByRole('button',{name:'วิเคราะห์ฉาก'}).click();
      await page.locator('#camera-dialog').waitFor({state:'hidden'});
      await page.waitForFunction(before => {
        const current = document.querySelector('#scene-image').src;
        return current.startsWith('blob:') && current !== before;
      }, uploaded);
      await page.locator('#library-tab').click();
      await page.locator('[data-filter=all]').click();
      await page.locator('#library-grid [data-pose=window-seat]').click();
      await page.locator('#use-pose').click();
      await page.waitForFunction(() => !document.querySelector('#shutter').disabled);
      assert.equal(await page.locator('#camera-guide').isVisible(), true);
      await page.locator('#timer').selectOption('3');
      await page.locator('#shutter').click();
      await page.waitForFunction(() => document.querySelector('#countdown').textContent === '3');
      await page.locator('#shot-preview').waitFor();
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#download').click()]);
      assert.equal(download.suggestedFilename(), 'framewise.jpg');
      assert.equal(await page.locator('#live-video').evaluate(video => video.srcObject), null);
      await page.getByRole('button',{name:'ปิดกล้อง',exact:true}).click();
      await context.clearPermissions();
    }
    await page.evaluate(() => {
      Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async () => {throw new DOMException('denied','NotAllowedError');}});
    });
    if (await page.locator('#studio').isHidden()) await page.locator('#studio-tab').click();
    await page.locator('#camera-scene').click();
    await page.waitForFunction(() => document.querySelector('#camera-status').textContent.includes('อนุญาตกล้อง'));
    assert.equal(await page.locator('#camera-retry').isVisible(),true);
    await page.getByRole('button',{name:'ปิดกล้อง',exact:true}).click();
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
    console.log(`${engine.name()}: scene inference (3 fixtures), layout, presets, manual correction, save, camera permission fallback${chrome ? ', guided capture and JPEG export' : ''} passed`);
  } finally {
    await browser.close();
  }
}
