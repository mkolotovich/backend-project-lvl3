import { test, expect, beforeAll } from '@jest/globals';
import nock from 'nock';
import downloadPage from '../src/downloadPage.js';

beforeAll(async () => {
  nock.disableNetConnect();
});

test('network error', async () => {
  await expect(downloadPage('https://ru.hexlet.io/courses', '/usr')).rejects.toThrow();
});

test('dir read error', async () => {
  await expect(downloadPage('https://ru.hexlet.io/courses', '/sys')).rejects.toThrow();
});
