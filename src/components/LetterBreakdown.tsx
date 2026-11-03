import type { LetterValue } from '../calculate';
import { LetterTile } from './LetterTile';

const MAX_BREAKDOWN_LETTERS = 200;

type LetterBreakdownProps = {
  letters: LetterValue[];
  hasInput: boolean;
};

export function LetterBreakdown({ letters, hasInput }: LetterBreakdownProps) {
  // Bound the rendered list for long pastes; the calculation still uses all letters.
  const visibleLetters = letters.slice(0, MAX_BREAKDOWN_LETTERS);

  return (
    <section aria-labelledby="breakdown-title">
      <h2 id="breakdown-title">Breakdown</h2>
      <div className="letter-breakdown">
        {visibleLetters.map(({ letter, value }, index) => (
          <LetterTile key={index} letter={letter} value={value} />
        ))}
        {letters.length === 0 && (
          <p className="empty-state">
            {hasInput ? 'No A–Z letters found.' : 'No letters yet.'}
          </p>
        )}
      </div>
      {letters.length > MAX_BREAKDOWN_LETTERS && (
        <p className="breakdown-note">
          Showing the first {MAX_BREAKDOWN_LETTERS} letters. Your total includes
          every letter.
        </p>
      )}
    </section>
  );
}
