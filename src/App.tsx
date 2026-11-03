import { useRef, useState } from 'react';
import { AlphabetReference } from './components/AlphabetReference';
import { LetterBreakdown } from './components/LetterBreakdown';
import { FoodDrinkFinder } from './components/FoodDrinkFinder';
import { calculate } from './calculate';

export default function App() {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { total, letters } = calculate(text);
  const usedLetters = new Set(letters.map(({ letter }) => letter));

  function clearInput() {
    setText('');
    inputRef.current?.focus();
  }

  function selectName(name: string) {
    setText(name);
    inputRef.current?.focus();
  }

  return (
    <>
      <header>
        <a href="./" aria-label="Letter Sum home">
          <span aria-hidden="true">Σ</span> LETTER SUM
        </a>
      </header>

      <main>
        <h1>Add up your letters.</h1>
        <p className="intro">a = 1, b = 2, … z = 26. Uppercase works too.</p>

        <label htmlFor="text-input">Letters or words</label>
        <textarea
          ref={inputRef}
          id="text-input"
          rows={5}
          placeholder="Type something…"
          aria-describedby="input-hint"
          spellCheck={false}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="input-footer">
          <span>
            {letters.length.toLocaleString()}{' '}
            {letters.length === 1 ? 'letter' : 'letters'}
          </span>
          <button
            type="button"
            disabled={text.length === 0}
            onClick={clearInput}
          >
            Clear
          </button>
        </div>
        <p id="input-hint">Spaces, numbers, and punctuation don't count.</p>

        <div className="result">
          <span>Total</span>
          <output
            htmlFor="text-input"
            aria-live="polite"
            aria-atomic="true"
            aria-label="Letter sum"
          >
            {total.toLocaleString()}
          </output>
        </div>

        <LetterBreakdown letters={letters} hasInput={text.length > 0} />
        <AlphabetReference usedLetters={usedLetters} />
        <FoodDrinkFinder onSelect={selectName} />

        <footer>Calculated here in your browser.</footer>
      </main>
    </>
  );
}
