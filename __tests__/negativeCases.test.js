import { test, expect, beforeAll } from '@jest/globals';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import nock from 'nock';
import downloadPage from '../src/downloadPage.js';

const { promises: fsp } = fs;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

beforeAll(async () => {
  nock.disableNetConnect();
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(404, await fsp.readFile(getFixturePath('sourceWithAliases.html'), 'utf-8'));
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
});

test('network error', async () => {
  await expect(downloadPage('https://ru.hexlet.io/courses', '/usr')).rejects.toThrow();
});

test('dir read error', async () => {
  await expect(downloadPage('https://ru.hexlet.io/courses', '/sys')).rejects.toThrow();
});
