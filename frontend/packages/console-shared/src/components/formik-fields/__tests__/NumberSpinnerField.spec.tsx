import { screen, configure, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFormikRenderer } from '../../../test-utils/unit-test-utils';
import NumberSpinnerField from '../NumberSpinnerField';

const getInput = () => screen.getByTestId('number-spinner-field') as HTMLInputElement;

configure({ testIdAttribute: 'data-test-id' });

describe('Number Spinner Field', () => {
  it('should render input field with type number', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />);
    expect(getInput().type).toEqual('number');
  });

  it('should render label, help text, and increment/decrement controls', () => {
    mockFormikRenderer(
      <NumberSpinnerField name="spinnerField" label="Replica Count" helpText="Enter a number" />,
    );
    expect(screen.getByText('Replica Count')).toBeVisible();
    expect(screen.getByText('Enter a number')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Increment' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Decrement' })).toBeVisible();
  });

  it('should expose the spinbutton role for the numeric input', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" label="Replicas" />);
    expect(screen.getByRole('spinbutton')).toBeVisible();
  });

  it('should associate helper text with the input via aria-describedby when helpText is set', () => {
    mockFormikRenderer(
      <NumberSpinnerField name="spinnerField" helpText="Helpful description" label="Replicas" />,
    );
    expect(getInput()).toHaveAttribute(
      'aria-describedby',
      'form-number-spinner-spinnerField-field-helper',
    );
  });

  it('should display initial value from Formik', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: 5 });
    expect(getInput()).toHaveValue(5);
  });

  it('should display 0 when the Formik value is empty', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: '' });
    expect(getInput().value).toEqual('0');
  });

  it('should only put numbers in input field', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: '' });

    expect(getInput().value).toEqual('0');

    await user.clear(getInput());
    await user.type(getInput(), '12');

    await waitFor(() => expect(getInput().value).toEqual('12'));
  });

  it('should increment or decrement value based on clicked button', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: '' });

    expect(getInput().value).toEqual('0');
    await user.click(screen.getByRole('button', { name: 'Increment' }));
    await user.click(screen.getByRole('button', { name: 'Increment' }));
    expect(getInput().value).toEqual('2');
    await user.click(screen.getByRole('button', { name: 'Decrement' }));
    expect(getInput().value).toEqual('1');
  });

  it('should not decrement below min when value equals min', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" min={3} />, {
      spinnerField: 3,
    });

    await user.click(screen.getByRole('button', { name: 'Decrement' }));
    expect(getInput().value).toEqual('3');
  });

  it('should not increment above max when value equals max', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" max={7} />, {
      spinnerField: 7,
    });

    await user.click(screen.getByRole('button', { name: 'Increment' }));
    expect(getInput().value).toEqual('7');
  });

  it('should increment value when ArrowUp is pressed on the input', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: 2 });

    await user.click(getInput());
    await user.keyboard('{ArrowUp}');

    await waitFor(() => expect(getInput().value).toEqual('3'));
  });

  it('should decrement value when ArrowDown is pressed on the input', async () => {
    const user = userEvent.setup();
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: 4 });

    await user.click(getInput());
    await user.keyboard('{ArrowDown}');

    await waitFor(() => expect(getInput().value).toEqual('3'));
  });
});
