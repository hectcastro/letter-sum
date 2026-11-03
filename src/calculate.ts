export type LetterValue = {
  letter: string;
  value: number;
};

export type Calculation = {
  total: number;
  letters: LetterValue[];
};

const FIRST_LETTER_CODE = 'A'.charCodeAt(0);

export function calculate(text: string): Calculation {
  const letters = (text.match(/[a-z]/gi) ?? []).map((character) => {
    const letter = character.toUpperCase();
    const value = letter.charCodeAt(0) - FIRST_LETTER_CODE + 1;
    return { letter, value };
  });

  const total = letters.reduce((sum, { value }) => sum + value, 0);
  return { total, letters };
}
