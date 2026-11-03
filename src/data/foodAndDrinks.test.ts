import { expect, test } from 'vitest';
import generated from './foodAndDrinks.generated.json';
import overrides from './foodAndDrinks.overrides.json';
import { FOOD_AND_DRINKS } from './foodAndDrinks';
import { calculate } from '../calculate';

test('generated names are unique and have valid categories and provenance', () => {
  const names = generated.entries.map(({ name }) => name);
  expect(new Set(names).size).toBe(names.length);
  for (const entry of generated.entries) {
    expect(entry.name).toBe(entry.name.trim().toLowerCase());
    expect(['food', 'drink']).toContain(entry.category);
    expect(entry.name).toMatch(/[a-z]/);
    expect(entry.synsets.every((id) => /^oewn-\d+-n$/.test(id))).toBe(true);
    expect(
      entry.synsets.length > 0 ||
        overrides.additions.some(({ name }) => name === entry.name),
    ).toBe(true);
  }
});

test('preserves curated entries and excludes non-food dictionary meanings', () => {
  for (const entry of overrides.additions) {
    expect(FOOD_AND_DRINKS).toContainEqual(expect.objectContaining(entry));
  }
  for (const name of ['pasture', 'cookout', 'nutrition', 'canned foods']) {
    expect(FOOD_AND_DRINKS.some((entry) => entry.name === name)).toBe(false);
  }
});

test('includes individual multiword dishes and additional exact matches', () => {
  for (const name of ['beef patty', 'chicken kiev', 'moussaka', 'poutine']) {
    expect(FOOD_AND_DRINKS).toContainEqual(
      expect.objectContaining({ name, category: 'food' }),
    );
    expect(calculate(name).total).toBe(100);
  }
  expect(
    FOOD_AND_DRINKS.find(({ name }) => name === 'malted milk')?.category,
  ).toBe('drink');
});
