import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import App from './App';

test('switches WordNet categories and loads a 100-point match into the calculator', async () => {
  const user = userEvent.setup();
  render(<App />);
  const finder = within(
    screen.getByRole('region', { name: 'Explore WordNet categories' }),
  );

  expect(finder.getByRole('button', { name: 'pumpkin' })).toBeVisible();
  expect(finder.getByRole('button', { name: 'whiskey' })).toBeVisible();
  expect(finder.getByLabelText('Target sum')).toHaveTextContent(/^100$/);
  expect(finder.getAllByRole('combobox')).toHaveLength(1);
  await user.selectOptions(finder.getByLabelText('Category'), 'noun.animal');
  expect(
    finder.queryByRole('button', { name: 'pumpkin' }),
  ).not.toBeInTheDocument();
  expect(
    finder.queryByRole('button', { name: 'whiskey' }),
  ).not.toBeInTheDocument();
  await user.click(finder.getByRole('button', { name: 'turkey' }));

  expect(screen.getByLabelText('Letters or words')).toHaveValue('turkey');
  expect(screen.getByLabelText('Letters or words')).toHaveFocus();
  expect(screen.getByLabelText('Letter sum')).toHaveTextContent(/^100$/);

  await user.selectOptions(finder.getByLabelText('Category'), 'noun.food');
  expect(finder.getByRole('button', { name: 'whiskey' })).toBeVisible();
});

test('shows an empty category and recovers when another category is selected', async () => {
  const user = userEvent.setup();
  render(<App />);
  const finder = within(
    screen.getByRole('region', { name: 'Explore WordNet categories' }),
  );
  await user.selectOptions(finder.getByLabelText('Category'), 'noun.motive');
  expect(finder.getByRole('status')).toHaveTextContent(
    '0 matches in 78 terms searched in Motives.',
  );
  expect(finder.getByText(/No terms in motives add up to 100/)).toBeVisible();
  expect(finder.queryByRole('list')).not.toBeInTheDocument();
  await user.selectOptions(finder.getByLabelText('Category'), 'adj.ppl');
  expect(finder.getAllByRole('button')).toHaveLength(2);
});

test('updates the sum, count, and breakdown as the user types', async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByLabelText('Letter sum')).toHaveTextContent(/^0$/);
  expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();

  await user.type(screen.getByLabelText('Letters or words'), 'a');
  expect(screen.getByLabelText('Letter sum')).toHaveTextContent(/^1$/);
  expect(screen.getByText('1 letter')).toBeInTheDocument();

  await user.type(screen.getByLabelText('Letters or words'), 'B! 2');
  expect(screen.getByLabelText('Letter sum')).toHaveTextContent(/^3$/);
  expect(screen.getByText('2 letters')).toBeInTheDocument();
  const breakdown = within(screen.getByRole('region', { name: 'Breakdown' }));
  expect(breakdown.getByText('A')).toBeInTheDocument();
  expect(breakdown.getByText('B')).toBeInTheDocument();
});

test('Clear resets the result and returns focus to the input', async () => {
  const user = userEvent.setup();
  render(<App />);
  const input = screen.getByLabelText('Letters or words');

  await user.type(input, 'Hello');
  await user.click(screen.getByRole('button', { name: 'Clear' }));

  expect(input).toHaveValue('');
  expect(input).toHaveFocus();
  expect(screen.getByLabelText('Letter sum')).toHaveTextContent(/^0$/);
  expect(screen.getByText('No letters yet.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
});

test('distinguishes input without letters from empty input', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText('Letters or words'), '123!?');

  expect(screen.getByLabelText('Letter sum')).toHaveTextContent(/^0$/);
  expect(screen.getByText('No A–Z letters found.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled();
});

test('limits the displayed breakdown without truncating the total', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByLabelText('Letters or words'));
  await user.paste('z'.repeat(201));

  expect(screen.getByLabelText('Letter sum')).toHaveTextContent(
    (5226).toLocaleString(),
  );
  const breakdown = within(screen.getByRole('region', { name: 'Breakdown' }));
  expect(breakdown.getAllByText('Z')).toHaveLength(200);
  expect(
    breakdown.getByText(
      'Showing the first 200 letters. Your total includes every letter.',
    ),
  ).toBeInTheDocument();
});

test('opens the alphabet reference and updates highlights with the input', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByText('Alphabet reference'));
  const alphabet = within(
    screen.getByRole('group', { name: 'Alphabet values' }),
  );
  expect(alphabet.getByText('Z')).toBeVisible();
  expect(alphabet.getByText('26')).toBeVisible();

  await user.type(screen.getByLabelText('Letters or words'), 'z');
  expect(alphabet.getByText('Z').parentElement).toHaveClass('active');
  expect(alphabet.getByText('A').parentElement).not.toHaveClass('active');
  await user.click(screen.getByRole('button', { name: 'Clear' }));
  expect(alphabet.getByText('Z').parentElement).not.toHaveClass('active');
});
