const { test, describe } = require('node:test');
const assert = require('node:assert');
const { normalizeFiscalYear } = require('../src/utils/fiscalYear');

describe('normalizeFiscalYear', () => {
  test('normalizes standard 2081/82', () => {
    assert.strictEqual(normalizeFiscalYear('2081/82'), '2081/82');
  });

  test('normalizes hyphenated 2081-82', () => {
    assert.strictEqual(normalizeFiscalYear('2081-82'), '2081/82');
  });

  test('normalizes short start year 081/82', () => {
    assert.strictEqual(normalizeFiscalYear('081/82'), '2081/82');
  });

  test('normalizes padded end year 2081/082', () => {
    assert.strictEqual(normalizeFiscalYear('2081/082'), '2081/82');
  });

  test('normalizes 4-digit end year 2081/2082', () => {
    assert.strictEqual(normalizeFiscalYear('2081/2082'), '2081/82');
  });

  test('returns empty string for empty input', () => {
    assert.strictEqual(normalizeFiscalYear(''), '');
    assert.strictEqual(normalizeFiscalYear(null), '');
  });
});

