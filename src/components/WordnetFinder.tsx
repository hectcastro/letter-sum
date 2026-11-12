import { useState } from 'react';
import dictionary from '../data/wordnet.generated.json';

const CATEGORY_GROUPS = [
  { prefix: 'noun.', label: 'Nouns' },
  { prefix: 'verb.', label: 'Verbs' },
  { prefix: 'adj.', label: 'Adjectives' },
  { prefix: 'adv.', label: 'Adverbs' },
];

export function WordnetFinder({
  onSelect,
}: {
  onSelect: (name: string) => void;
}) {
  const [categoryId, setCategoryId] = useState('noun.food');
  const category = dictionary.categories.find(({ id }) => id === categoryId)!;
  const { source, target } = dictionary;

  return (
    <section className="finder" aria-labelledby="finder-title">
      <h2 id="finder-title">Explore WordNet categories</h2>
      <p className="finder-description">
        Choose one of {dictionary.categories.length} categories to find words
        and phrases that add up to {target}. Multiword terms stay whole.
      </p>

      <div className="finder-controls">
        <div className="category-control">
          <label htmlFor="wordnet-category">Category</label>
          <select
            id="wordnet-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {CATEGORY_GROUPS.map(({ prefix, label }) => (
              <optgroup key={prefix} label={label}>
                {dictionary.categories
                  .filter(({ id }) => id.startsWith(prefix))
                  .map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="finder-target">
          <span id="target-label">Target sum</span>
          <strong aria-labelledby="target-label">{target}</strong>
        </div>
      </div>

      <p className="finder-status" role="status">
        {category.matches.length}{' '}
        {category.matches.length === 1 ? 'match' : 'matches'} in{' '}
        {category.count.toLocaleString()} terms searched in {category.label}.
      </p>
      {category.matches.length > 0 ? (
        <>
          <p className="finder-description">
            Select a term to see its calculation above.
          </p>
          <ul className="match-list">
            {category.matches.map(({ name }) => (
              <li key={name}>
                <button type="button" onClick={() => onSelect(name)}>
                  {name}
                </button>
                <strong>{target}</strong>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="finder-description">
          No terms in {category.label.toLowerCase()} add up to {target}. Try
          another category.
        </p>
      )}
      <p className="finder-description">
        Based on{' '}
        <a href={source.homepage}>
          {source.name} {source.version}
        </a>{' '}
        by the Open English Wordnet Community, derived from Princeton WordNet.
        Adapted under <a href={source.license}>CC BY 4.0</a>, with food filters
        and curated food additions. Categories reflect dictionary meanings; a
        term may belong to more than one. Only A–Z letters contribute to sums.
      </p>
    </section>
  );
}
