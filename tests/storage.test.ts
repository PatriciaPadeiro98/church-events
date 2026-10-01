import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseStoredJson } from '../src/utils/storage.ts';

describe('storage utils', () => {
  it('returns fallback for empty storage', () => {
    assert.deepEqual(parseStoredJson(null, []), []);
  });

  it('returns fallback for invalid json', () => {
    assert.deepEqual(parseStoredJson('{', ['fallback']), ['fallback']);
  });

  it('parses valid json', () => {
    assert.deepEqual(parseStoredJson('{"name":"Festa"}', {}), {
      name: 'Festa',
    });
  });
});
