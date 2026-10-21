import { screen, configure } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFormikRenderer } from '../../../test-utils/unit-test-utils';
import NumberSpinnerField from '../NumberSpinnerField';

configure({ testIdAttribute: 'data-test-id' });

const getInput = () => screen.getByRole('spinbutton') as HTMLInputElement;

describe('NumberSpinnerField', () => {
  it('renders input with label, help text, and increment/decrement buttons', () => {
    mockFormikRenderer(
      <NumberSpinnerField name="spinnerField" label="Replica Count" helpText="Enter a number" />,
    );
    expect(getInput()).toHaveAttribute('type', 'number');
    expect(screen.getByText('Replica Count')).toBeVisible();
    expect(screen.getByText('Enter a number')).toBeVisible();
    expect(screen.getByRole('button', { name: /increment/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /decrement/i })).toBeVisible();
  });

  it('displays initial value from formik', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: 5 });
    expect(getInput()).toHaveValue(5);
  });

  it('displays 0 when initial value is empty', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: '' });
    expect(getInput()).toHaveValue(0);
  });

  it('updates value when typing in input field', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: '' });

    await user.clear(getInput());
    await user.type(getInput(), '42');

    expect(getInput()).toHaveValue(42);
  });

  it('increments value when increment button is clicked', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: 0 });

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(getInput()).toHaveValue(1);
  });

  it('decrements value when decrement button is clicked', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: 5 });

    await user.click(screen.getByRole('button', { name: /decrement/i }));

    expect(getInput()).toHaveValue(4);
  });

  it('associates help text with input via aria-describedby', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" helpText="Helpful description" />);
    expect(getInput()).toHaveAttribute('aria-describedby');
  });

  it('input is accessible by spinbutton role', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" label="Replicas" />);
    expect(screen.getByRole('spinbutton')).toBeVisible();
  });

  it('does not decrement below min when value equals min', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" min={3} />, {
      spinnerField: 3,
    });

    await user.click(screen.getByRole('button', { name: /decrement/i }));

    expect(getInput()).toHaveValue(3);
  });

  it('does not increment above max when value equals max', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" max={7} />, {
      spinnerField: 7,
    });

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(getInput()).toHaveValue(7);
  });

  it('increments value when ArrowUp is pressed on the input', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: 2 });

    await user.click(getInput());
    await user.keyboard('{ArrowUp}');

    expect(getInput()).toHaveValue(3);
  });

  it('decrements value when ArrowDown is pressed on the input', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: 4 });

    await user.click(getInput());
    await user.keyboard('{ArrowDown}');

    expect(getInput()).toHaveValue(3);
  });
});
