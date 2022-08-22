import {
  test, expect, beforeEach, describe,
} from '@jest/globals';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import nock from 'nock';
import os from 'os';
import downloadPage from '../src/downloadPage.js';

const { promises: fsp } = fs;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

let dir;

beforeEach(async () => {
  nock.disableNetConnect();
  dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('modify page', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, await fsp.readFile(getFixturePath('source.html'), 'utf-8'));
  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, await fsp.readFile(getFixturePath('nodejs.png')));
  await downloadPage('https://ru.hexlet.io/courses', dir);
  const source = await fsp.readFile(getFixturePath('downloaded.html'));
  expect(source).toEqual(await fsp.readFile(path.resolve(dir, 'ru-hexlet-io-courses.html')));
});

test('save file', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, await fsp.readFile(getFixturePath('source.html'), 'utf-8'));
  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, await fsp.readFile(getFixturePath('nodejs.png')));
  await downloadPage('https://ru.hexlet.io/courses', dir);
  const file = await fsp.readFile(path.resolve(dir, 'ru-hexlet-io-courses.html'), 'utf-8');
  expect(file).not.toBeNull();
});

test('return right object', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, await fsp.readFile(getFixturePath('source.html'), 'utf-8'));
  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, await fsp.readFile(getFixturePath('nodejs.png')));
  const file = await fsp.readFile(getFixturePath('expected.json'), 'utf-8');
  const object = JSON.parse(file);
  expect(await downloadPage('https://ru.hexlet.io/courses', '/var/tmp')).toEqual(object);
});

test('network error', async () => {
  await expect(downloadPage('https://ru.hexlet.io/courses', '/usr')).rejects.toThrow(new Error('network error! https://ru.hexlet.io/courses not responded'));
});

test('parsing error', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, await fsp.readFile(getFixturePath('expected.json'), 'utf-8'));
  await expect(downloadPage('https://ru.hexlet.io/courses', dir)).rejects.toThrow(new Error('parsing error! page is not HTML format!'));
});

test('dir read error', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, await fsp.readFile(getFixturePath('source.html'), 'utf-8'));
  await expect(downloadPage('https://ru.hexlet.io/courses', '/sys')).rejects.toThrow(new Error("file error! EACCES: permission denied, mkdir '/sys/ru-hexlet-io-courses_files'"));
});

describe.each([
  ['ru-hexlet-io-courses_files', 'ru-hexlet-io-assets-application.css'],
  ['ru-hexlet-io-courses_files', 'ru-hexlet-io-assets-professions-nodejs.png'],
])('downloadPage(%s, %s, %s)', (b, expected) => {
  test(`save ${expected}`, async () => {
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, await fsp.readFile(getFixturePath('sourceWithAliases.html'), 'utf-8'));
    nock('https://ru.hexlet.io')
      .get('/assets/professions/nodejs.png')
      .reply(200, await fsp.readFile(getFixturePath('nodejs.png')));
    nock('https://ru.hexlet.io')
      .get('/assets/application.css')
      .reply(200, await fsp.readFile(getFixturePath('styles.css'), 'utf-8'));
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, await fsp.readFile(getFixturePath('sourceWithAliases.html'), 'utf-8'));
    nock('https://ru.hexlet.io')
      .get('/packs/js/runtime.js')
      .reply(200);
    await downloadPage('https://ru.hexlet.io/courses', dir);
    expect(await fsp.readFile(path.resolve(dir, b, expected), 'utf-8')).not.toBeNull();
  });
});
