import assert from 'node:assert/strict';
import test from 'node:test';
import { appendTranscript, fileExtension, formatElapsed, pickMimeType } from '../src/scripts/office/dictate.ts';

test('pickMimeType prefers opus webm (Chrome) and falls back to mp4 (iOS Safari)', () => {
  assert.equal(pickMimeType((t) => t.startsWith('audio/webm')), 'audio/webm;codecs=opus');
  assert.equal(pickMimeType((t) => t === 'audio/mp4'), 'audio/mp4');
  assert.equal(pickMimeType(() => false), '');
});

test('fileExtension matches what Scribe expects from the recorded container', () => {
  assert.equal(fileExtension('audio/mp4'), 'm4a');
  assert.equal(fileExtension('audio/webm;codecs=opus'), 'webm');
  assert.equal(fileExtension('audio/ogg;codecs=opus'), 'ogg');
});

test('appendTranscript keeps what was typed and adds one space before the spoken text', () => {
  assert.equal(appendTranscript('', ' เตรียมงาน greendeli '), 'เตรียมงาน greendeli');
  assert.equal(appendTranscript('งานด่วน', 'เตรียมงาน'), 'งานด่วน เตรียมงาน');
  assert.equal(appendTranscript('งานด่วน\n', 'เตรียมงาน'), 'งานด่วน\nเตรียมงาน');
  assert.equal(appendTranscript('งานด่วน', '   '), 'งานด่วน');
});

test('formatElapsed shows m:ss for the recording timer', () => {
  assert.equal(formatElapsed(0), '0:00');
  assert.equal(formatElapsed(65_400), '1:05');
  assert.equal(formatElapsed(-5), '0:00');
});
