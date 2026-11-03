import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { calculate } from '../src/calculate.ts';

const root = new URL('../', import.meta.url);
const readJson = async (path) =>
  JSON.parse(await readFile(new URL(path, root), 'utf8'));
const data = await readJson('src/data/foodAndDrinks.generated.json');
const audit = await readJson('.cache/wordnet/import-audit.json');
const scored = data.entries.map((entry) => ({
  ...entry,
  total: calculate(entry.name).total,
}));
const report = {
  source: data.source,
  counts: {
    total: scored.length,
    food: scored.filter((entry) => entry.category === 'food').length,
    drink: scored.filter((entry) => entry.category === 'drink').length,
  },
  ...audit,
  matches: Object.fromEntries(
    [100, 1000].map((target) => [
      target,
      scored.filter((entry) => entry.total === target),
    ]),
  ),
};

await mkdir(new URL('reports/', root), { recursive: true });
const temporary = new URL('reports/food-terms.json.tmp', root);
await writeFile(temporary, `${JSON.stringify(report, null, 2)}\n`);
await rename(temporary, new URL('reports/food-terms.json', root));
console.log(
  JSON.stringify(
    {
      counts: report.counts,
      matches: Object.fromEntries(
        Object.entries(report.matches).map(([target, entries]) => [
          target,
          entries.map(({ name }) => name),
        ]),
      ),
    },
    null,
    2,
  ),
);
console.log(
  'Full provenance, exclusions, changes, and matches: reports/food-terms.json',
);
