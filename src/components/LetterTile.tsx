import type { LetterValue } from '../calculate';

type LetterTileProps = LetterValue & {
  highlighted?: boolean;
};

export function LetterTile({
  letter,
  value,
  highlighted = false,
}: LetterTileProps) {
  return (
    <div className={highlighted ? 'letter-tile active' : 'letter-tile'}>
      <span className="letter-character">{letter}</span>
      <span className="letter-value">{value}</span>
    </div>
  );
}
