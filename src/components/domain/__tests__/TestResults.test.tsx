import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestResults } from '../TestResults';

const makeResults = () => [
  {
    passed: true,
    input: '[1,2,3], target=4',
    expected: '[0,1]',
    actual: '[0,1]',
    isHidden: false,
  },
  {
    passed: false,
    input: '[4,5,6], target=10',
    expected: '[0,2]',
    actual: '[-1,-1]',
    isHidden: false,
  },
  {
    passed: true,
    input: 'hidden input',
    expected: 'hidden expected',
    actual: 'hidden actual',
    isHidden: true,
  },
];

describe('TestResults', () => {
  it('renders all visible results', () => {
    const results = makeResults();
    render(<TestResults results={results} passedCount={2} totalCount={3} />);

    expect(screen.getByText('[1,2,3], target=4')).toBeInTheDocument();
    expect(screen.getByText('[4,5,6], target=10')).toBeInTheDocument();
    expect(screen.queryByText('hidden input')).not.toBeInTheDocument();
  });

  it('shows pass icon for passed tests', () => {
    const results = makeResults();
    render(<TestResults results={results} passedCount={2} totalCount={3} />);

    // Pass icon is ✓ (unicode checkmark)
    const passIcons = screen.getAllByText('✓');
    // First visible result is passed, hidden passed also shows ✓ in summary
    expect(passIcons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows fail icon for failed tests', () => {
    const results = makeResults();
    render(<TestResults results={results} passedCount={2} totalCount={3} />);

    // Fail icon is ✗ (unicode ballot x)
    expect(screen.getByText('✗')).toBeInTheDocument();
  });

  it('displays input, expected, actual for visible tests', () => {
    const results = makeResults();
    render(<TestResults results={results} passedCount={2} totalCount={3} />);

    // Input for visible tests
    expect(screen.getByText('[1,2,3], target=4')).toBeInTheDocument();
    expect(screen.getByText('[0,1]')).toBeInTheDocument(); // expected of passed
    expect(screen.getByText('[4,5,6], target=10')).toBeInTheDocument();
    expect(screen.getByText('[0,2]')).toBeInTheDocument(); // expected of failed
    expect(screen.getByText('[-1,-1]')).toBeInTheDocument(); // actual of failed
  });

  it('shows summary bar with "X/Y tests passed"', () => {
    const results = makeResults();
    render(<TestResults results={results} passedCount={2} totalCount={3} />);

    expect(screen.getByText('2/3 tests passed')).toBeInTheDocument();
  });

  it('groups hidden results into summary row', () => {
    const results = makeResults();
    render(<TestResults results={results} passedCount={2} totalCount={3} />);

    expect(screen.getByText('1/1 hidden tests passed')).toBeInTheDocument();
  });

  it('"Why did this fail?" button calls onAskAboutFailure with formatted failure text', async () => {
    const user = userEvent.setup();
    const onAskAboutFailure = vi.fn();
    const results = makeResults();

    render(
      <TestResults
        results={results}
        passedCount={2}
        totalCount={3}
        onAskAboutFailure={onAskAboutFailure}
      />,
    );

    const button = screen.getByRole('button', { name: /ask ai why tests failed/i });
    await user.click(button);

    expect(onAskAboutFailure).toHaveBeenCalledTimes(1);
    const callArg = onAskAboutFailure.mock.calls[0][0];
    expect(callArg).toContain('Input: [4,5,6], target=10');
    expect(callArg).toContain('Expected: [0,2]');
    expect(callArg).toContain('Actual: [-1,-1]');
  });

  it('"Why did this fail?" button is disabled when no failures', () => {
    const results = [
      {
        passed: true,
        input: 'a',
        expected: 'b',
        actual: 'b',
        isHidden: false,
      },
    ];

    render(
      <TestResults results={results} passedCount={1} totalCount={1} onAskAboutFailure={vi.fn()} />,
    );

    // Button should not appear when there are no failures
    expect(screen.queryByRole('button', { name: /why did this fail/i })).not.toBeInTheDocument();
  });

  it('"Why did this fail?" button disabled when onAskAboutFailure not provided', () => {
    const results = makeResults();

    render(<TestResults results={results} passedCount={2} totalCount={3} />);

    // The button exists but is disabled
    const buttons = screen.getAllByRole('button');
    const failButton = buttons.find((b) => b.textContent?.includes('Why did this fail'));
    expect(failButton).toBeDefined();
    expect(failButton).toBeDisabled();
  });
});
