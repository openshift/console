import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import { mockFormikRenderer } from '../../../test-utils/unit-test-utils';
import NumberSpinnerField from '../NumberSpinnerField';

describe('Number Spinner Field', () => {
  it('should render input field with type number', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.type).toEqual('number');
  });

  it('should render input with increment decrement button', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />);

    expect(screen.getByRole('button', { name: 'Increment' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Decrement' })).toBeVisible();
  });

  it('should only put numbers in input field', async () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: '' });

    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toEqual('0');

    await act(async () => {
      await fireEvent.change(input, {
        currentTarget: { value: '12' },
        target: { value: '12' },
      });
    });

    await waitFor(() => expect(input.value).toEqual('12'));
  });

  it('should increment or decrement value based on clicked button', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: '' });

    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toEqual('0');

    fireEvent.click(screen.getByRole('button', { name: 'Increment' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increment' }));
    expect(input.value).toEqual('2');

    fireEvent.click(screen.getByRole('button', { name: 'Decrement' }));
    expect(input.value).toEqual('1');
  });
});
