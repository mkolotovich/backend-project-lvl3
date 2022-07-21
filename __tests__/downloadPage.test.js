import { test, expect } from '@jest/globals';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import downloadPage from '../src/downloadPage.js';

const { promises: fsp } = fs;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

test('save file', () => {
  downloadPage('https://ru.hexlet.io/courses', '/usr');
  const fileExpected = fsp.readFile(getFixturePath('expected.html'), 'utf-8');
  const file = fsp.readFile(path.resolve('/usr', 'ru-hexlet-io-courses.html'), 'utf-8');
  expect(file).toEqual(fileExpected);
});

test('return right object', async () => {
  const file = await fsp.readFile(getFixturePath('expected.json'), 'utf-8');
  const object = JSON.parse(file);
  expect(downloadPage('https://ru.hexlet.io/courses', '/usr')).toEqual(object);
});
