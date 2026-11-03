import { expect, test } from 'vitest';
import { calculate } from './calculate';

test('sums letter positions regardless of case', () => {
  expect(calculate('aBcZ').total).toBe(32);
  expect(calculate('Hello world').total).toBe(124);
  expect(calculate('abcdefghijklmnopqrstuvwxyz').total).toBe(351);
});

test('ignores everything outside ASCII letters', () => {
  expect(calculate(' A! b2\nc? 🐈 é ß K ').total).toBe(6);
  expect(calculate('123 ! 🐈').total).toBe(0);
  expect(calculate('').total).toBe(0);
});

test('returns the letters and values in input order for the breakdown', () => {
  expect(calculate('Cat!')).toEqual({
    total: 24,
    letters: [
      { letter: 'C', value: 3 },
      { letter: 'A', value: 1 },
      { letter: 'T', value: 20 },
    ],
  });
});
