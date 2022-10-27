import * as React from 'react';
import { screen, configure, fireEvent, act, waitFor } from '@testing-library/react';
import { mockFormikRenderer } from '../../../test-utils/unit-test-utils';
import NumberSpinnerField from '../NumberSpinnerField';

const getInput = () => screen.getByTestId('number-spinner-field') as HTMLInputElement;

describe('Number Spinner Field', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test-id' });
  });

  it('should render input field with type number', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />);
    const input = getInput();
    expect(input.type).toEqual('number');
  });

  it('should render input with increment decrement button', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />);
    screen.getByTestId('Increment');
    screen.getByTestId('Decrement');
  });

  it('should only put numbers in input field', async () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: '' });

    expect(getInput().value).toEqual('0');

    await act(async () => {
      await fireEvent.change(getInput(), {
        currentTarget: { value: '12' },
        target: { value: '12' },
      });
    });

    await waitFor(() => expect(getInput().value).toEqual('12'));
  });

  it('should increment or decrement value based on clicked button', () => {
    mockFormikRenderer(<NumberSpinnerField name="spinnerField" />, { spinnerField: '' });

    expect(getInput().value).toEqual('0');
    fireEvent.click(screen.getByTestId('Increment'));
    fireEvent.click(screen.getByTestId('Increment'));
    expect(getInput().value).toEqual('2');
    fireEvent.click(screen.getByTestId('Decrement'));
    expect(getInput().value).toEqual('1');
  });
});
