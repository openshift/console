import { render, screen, fireEvent, configure } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfigureUpdateStrategy } from '@console/internal/components/modals/configure-update-strategy-modal';

describe('ConfigureUpdateStrategy', () => {
  let onChangeStrategyType: jest.Mock;
  let onChangeMaxSurge: jest.Mock;
  let onChangeMaxUnavailable: jest.Mock;

  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    onChangeStrategyType = jest.fn();
    onChangeMaxSurge = jest.fn();
    onChangeMaxUnavailable = jest.fn();
  });

  it('renders two choices for different update strategy types', () => {
    render(
      <ConfigureUpdateStrategy
        onChangeStrategyType={onChangeStrategyType}
        onChangeMaxSurge={onChangeMaxSurge}
        onChangeMaxUnavailable={onChangeMaxUnavailable}
        strategyType="Recreate"
        maxSurge={null}
        maxUnavailable={null}
      />,
    );

    const rollingUpdateRadio = screen.getByTestId('rolling-update-strategy-radio');
    const recreateRadio = screen.getByTestId('recreate-update-strategy-radio');

    expect(rollingUpdateRadio).toBeInTheDocument();
    expect(recreateRadio).toBeInTheDocument();
    expect(recreateRadio).toBeChecked();
    expect(rollingUpdateRadio).not.toBeChecked();
  });

  it('is a controlled component', () => {
    render(
      <ConfigureUpdateStrategy
        onChangeStrategyType={onChangeStrategyType}
        onChangeMaxSurge={onChangeMaxSurge}
        onChangeMaxUnavailable={onChangeMaxUnavailable}
        strategyType="Recreate"
        maxSurge={null}
        maxUnavailable={null}
      />,
    );

    const rollingUpdateRadio = screen.getByTestId('rolling-update-strategy-radio');
    const maxUnavailableInput = screen.getByTestId('max-unavailable-input');
    const maxSurgeInput = screen.getByTestId('max-surge-input');

    fireEvent.click(rollingUpdateRadio);
    fireEvent.change(maxUnavailableInput, { target: { value: '25%' } });
    fireEvent.change(maxSurgeInput, { target: { value: '50%' } });

    expect(onChangeStrategyType).toHaveBeenCalledWith('RollingUpdate');
    expect(onChangeMaxUnavailable).toHaveBeenCalledWith('25%');
    expect(onChangeMaxSurge).toHaveBeenCalledWith('50%');
  });
});
