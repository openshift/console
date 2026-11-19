import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestSizeInput } from '../request-size-input';

// Unit tests: component has no Redux or Router dependencies.
jest.mock('react-i18next');

jest.mock('@console/internal/components/utils/console-select', () => ({
  ConsoleSelect: () => null,
}));

const dropdownUnits = {
  Mi: 'MiB',
  Gi: 'GiB',
  Ti: 'TiB',
};

describe('RequestSizeInput', () => {
  it('accepts decimal size values', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <RequestSizeInput
        name="requestSize"
        testID="input-request-size"
        onChange={onChange}
        defaultRequestSizeUnit="Gi"
        defaultRequestSizeValue="1"
        dropdownUnits={dropdownUnits}
        required
      />,
    );

    const input = screen.getByTestId('input-request-size');
    await user.clear(input);
    await user.type(input, '1.5');

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.value).toBe('1.5');
    expect(lastCall.unit).toBe('Gi');
    expect(input).toHaveValue(1.5);
  });

  it('initializes from a decimal default value without truncating', () => {
    render(
      <RequestSizeInput
        name="requestSize"
        testID="input-request-size"
        onChange={jest.fn()}
        defaultRequestSizeUnit="Gi"
        defaultRequestSizeValue="2.75"
        dropdownUnits={dropdownUnits}
      />,
    );

    expect(screen.getByTestId('input-request-size')).toHaveValue(2.75);
  });

  it('synchronizes empty input to 0 for display and onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <RequestSizeInput
        name="requestSize"
        testID="input-request-size"
        onChange={onChange}
        defaultRequestSizeUnit="Gi"
        defaultRequestSizeValue="1"
        dropdownUnits={dropdownUnits}
      />,
    );

    const input = screen.getByTestId('input-request-size');
    await user.clear(input);

    expect(input).toHaveValue(0);
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.value).toBe(0);
    expect(lastCall.unit).toBe('Gi');
  });

  it('increments and decrements by numeric step via spinner buttons', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <RequestSizeInput
        name="requestSize"
        testID="input-request-size"
        onChange={onChange}
        defaultRequestSizeUnit="Gi"
        defaultRequestSizeValue="1"
        dropdownUnits={dropdownUnits}
        step={0.5}
      />,
    );

    await user.click(screen.getByTestId('Increment'));
    expect(screen.getByTestId('input-request-size')).toHaveValue(1.5);
    expect(onChange.mock.calls[onChange.mock.calls.length - 1][0].value).toBe(1.5);

    await user.click(screen.getByTestId('Decrement'));
    expect(screen.getByTestId('input-request-size')).toHaveValue(1);
    expect(onChange.mock.calls[onChange.mock.calls.length - 1][0].value).toBe(1);
  });
});
