# letter-sum

A single-page letter-value calculator. A–Z count as 1–26, independent of case. Other characters contribute zero. The total updates on every edit; letter tiles explain the result. For long input, the breakdown shows the first 200 letters and the total still includes all letters.

## Food and drinks

The finder uses a generated subset of [Open English Wordnet 2025](https://en-word.net/), supplemented by the original curated list. These are dictionary-derived candidates, not an exhaustive or fully hand-reviewed catalogue. Each entry is a whole name; the importer never combines names to achieve a target.

### Update the dictionary data

Requires Python 3.9+ and the Node.js version required by this project. No Python packages are needed.

```sh
npm run data:update
npm test
npm run test:importer
```

The first import downloads the pinned XML.gz release into ignored `.cache/wordnet/`; later runs reuse it offline. Its SHA-256 is checked before parsing or replacing generated data. For a local copy, run `python3 scripts/import-food-terms.py --source /path/to/english-wordnet-2025.xml.gz`, then `node --experimental-strip-types scripts/report-food-terms.mjs`.

Review these files after each update:

- `src/data/foodAndDrinks.generated.json`: sorted, deduplicated names, categories, original synset identifiers, and source attribution. Do not edit by hand.
- `reports/food-terms.json`: category counts, additions/removals/reclassifications since the previous generated file (the curated list on the first import), excluded senses, ambiguous categories, and exact matches for 100 and 1000. Sums use the same TypeScript calculation function as the app. Repeating an unchanged import produces an empty changes section.
- `src/data/foodAndDrinks.overrides.json`: reviewed additions and category corrections, plus exclusions with a reason. The original 261 entries are retained here. Add one established food, dish, or drink name per entry. Exclusions and additions may not contain the same name.

Commit the generated file, overrides, source policy, and report together. Normal builds and the browser use committed data; they never fetch WordNet. The deployment workflow runs offline importer tests, not dictionary updates.

### Selection rules and limitations

`scripts/wordnet-source.json` pins the release, checksum, beverage root, and exclusions. The importer selects noun senses in `noun.food`, prunes branches for animal feed, meal occasions, diets, food supplies, cuisine, and portion sizes, then excludes selected generic concepts. Other senses of an excluded word remain eligible: for example, grain _meal_ is still an ingredient. Ordinary food categories and ingredients may remain; the list has not been individually verified in full.

Names under either the beverage root or the serving-of-a-drink root are drinks; other qualifying senses are foods. Named drinks under the latter root are retained despite the portion exclusion (for example, milkshakes). When a name has both food and drink senses, drink takes priority and the ambiguity is listed in the report. A curated addition can explicitly correct that category. Names are lowercased, underscores become spaces, and repeated whitespace is collapsed. Punctuation and accents are preserved; the calculator continues to count only ASCII A–Z. Alternative spellings remain separate.

To change releases, update the source version, URL, SHA-256, and verify every policy synset ID against the new release. Missing policy IDs fail the import. Re-run the command and inspect the diff rather than accepting a new checksum automatically.

### Attribution

The generated subset is adapted from Open English Wordnet by the Open English Wordnet Community, derived from Princeton WordNet, under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Source: [2025 release](https://github.com/globalwordnet/english-wordnet/releases/tag/2025-edition). Changes include category selection, exclusions, normalization, deduplication, and curated additions. Attribution and the source link are also displayed in the app and included in the generated data and report.
