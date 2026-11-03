import { useState } from 'react';
import { calculate } from '../calculate';
import { FOOD_AND_DRINKS } from '../data/foodAndDrinks';

// Score the fixed list once using the same rules as the calculator.
const SCORED_NAMES = FOOD_AND_DRINKS.map((entry) => ({
  ...entry,
  total: calculate(entry.name).total,
})).sort((a, b) => a.name.localeCompare(b.name));

type FoodDrinkFinderProps = {
  onSelect: (name: string) => void;
};

export function FoodDrinkFinder({ onSelect }: FoodDrinkFinderProps) {
  const [target, setTarget] = useState(100);
  const [category, setCategory] = useState('all');
  const candidates = SCORED_NAMES.filter(
    (entry) => category === 'all' || entry.category === category,
  );
  const matches = candidates.filter((entry) => entry.total === target);

  return (
    <section className="finder" aria-labelledby="finder-title">
      <h2 id="finder-title">Find food &amp; drink</h2>
      <p className="finder-description">
        Search {FOOD_AND_DRINKS.length} food, dish, and drink names. Each result
        is one item, never a combination of unrelated names.
      </p>

      <div className="finder-controls">
        <div>
          <label htmlFor="target-sum">Target sum</label>
          <select
            id="target-sum"
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
          >
            <option value={100}>100</option>
            <option value={1000}>1000</option>
          </select>
        </div>
        <div>
          <label htmlFor="food-category">Category</label>
          <select
            id="food-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">Food &amp; drink</option>
            <option value="food">Food &amp; dishes</option>
            <option value="drink">Drinks</option>
          </select>
        </div>
      </div>

      <p className="finder-status" role="status">
        {matches.length} {matches.length === 1 ? 'match' : 'matches'} in{' '}
        {candidates.length} names searched.
      </p>
      {matches.length > 0 ? (
        <>
          <p className="finder-description">
            Select a name to see its calculation above.
          </p>
          <ul className="match-list">
            {matches.map(({ name, category: matchCategory, total }) => (
              <li key={name}>
                <button type="button" onClick={() => onSelect(name)}>
                  {name}
                </button>
                <span>
                  {matchCategory === 'food' ? 'food / dish' : 'drink'}
                </span>
                <strong>{total}</strong>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="finder-description">
          No matches in this list for {target}. This is a starter list, not
          every food or drink name.
        </p>
      )}
      {target === 1000 && (
        <p className="finder-description">
          A sum of 1000 needs at least 39 letters, even if every letter is worth
          26. Only a very long individual name could qualify.
        </p>
      )}
      <p className="finder-description">
        Built-in, manually curated list. Exact spelling matters; spaces and
        punctuation are ignored. Multiword dish and drink names count as one
        item.
      </p>
    </section>
  );
}
