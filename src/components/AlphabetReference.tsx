import { LetterTile } from './LetterTile';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

type AlphabetReferenceProps = {
  usedLetters: ReadonlySet<string>;
};

export function AlphabetReference({ usedLetters }: AlphabetReferenceProps) {
  return (
    <details>
      <summary>Alphabet reference</summary>
      <div className="alphabet" role="group" aria-label="Alphabet values">
        {ALPHABET.map((letter, index) => (
          <LetterTile
            key={letter}
            letter={letter}
            value={index + 1}
            highlighted={usedLetters.has(letter)}
          />
        ))}
      </div>
    </details>
  );
}
