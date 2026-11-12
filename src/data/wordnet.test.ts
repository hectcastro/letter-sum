import { expect, test } from 'vitest';
import dictionary from './wordnet.generated.json';
import foods from './foodAndDrinks.generated.json';
import { calculate } from '../calculate';

test('every category contains unique, provenanced terms that total 100', () => {
  const ids = dictionary.categories.map(({ id }) => id);
  expect(new Set(ids).size).toBe(45);
  for (const category of dictionary.categories) {
    const names = category.matches.map(({ name }) => name);
    expect(new Set(names).size).toBe(names.length);
    expect(category.count).toBeGreaterThanOrEqual(names.length);
    for (const entry of category.matches) {
      expect(calculate(entry.name).total).toBe(100);
      expect(entry.synsets.every((id) => /^oewn-\d+-[nvars]$/.test(id))).toBe(
        true,
      );
      if (category.id !== 'noun.food')
        expect(entry.synsets.length).toBeGreaterThan(0);
    }
  }
});

test('preserves curated food matches and shared words across categories', () => {
  const food = dictionary.categories.find(({ id }) => id === 'noun.food')!;
  expect(food.count).toBe(foods.entries.length);
  expect(food.matches.map(({ name }) => name)).toEqual(
    foods.entries
      .filter(({ name }) => calculate(name).total === 100)
      .map(({ name }) => name),
  );
  const animals = dictionary.categories.find(({ id }) => id === 'noun.animal')!;
  expect(animals.matches.map(({ name }) => name)).toContain('turkey');
  expect(food.matches.map(({ name }) => name)).toContain('turkey');
  expect(animals.matches.map(({ name }) => name)).not.toContain('whiskey');
});
