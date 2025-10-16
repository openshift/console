import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfigureUpdateStrategy } from '@console/internal/components/modals/configure-update-strategy-modal';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

const defaultProps = {
  onChangeStrategyType: jest.fn(),
  onChangeMaxSurge: jest.fn(),
  onChangeMaxUnavailable: jest.fn(),
  maxSurge: '25%',
  maxUnavailable: '25%',
  replicas: 3,
};

describe('ConfigureUpdateStrategy component', () => {
  let mockProps: typeof defaultProps;

  beforeEach(() => {
    mockProps = {
      ...defaultProps,
      onChangeStrategyType: jest.fn(),
      onChangeMaxSurge: jest.fn(),
      onChangeMaxUnavailable: jest.fn(),
    };
  });

  describe('RollingUpdate strategy', () => {
    beforeEach(() => {
      renderWithProviders(<ConfigureUpdateStrategy {...mockProps} strategyType="RollingUpdate" />);
    });

    it('has proper labels', () => {
      expect(screen.getByText('RollingUpdate (default)')).toBeVisible();
      expect(screen.getByText('Recreate')).toBeVisible();
      expect(screen.getByText('Max unavailable')).toBeVisible();
      expect(screen.getByText('Max surge')).toBeVisible();
    });

    it('shows rolling update strategy as selected', () => {
      const rollingUpdateRadio = screen.getByTestId('rolling-update-strategy-radio');
      const recreateRadio = screen.getByTestId('recreate-update-strategy-radio');

      expect(rollingUpdateRadio).toBeChecked();
      expect(recreateRadio).not.toBeChecked();
    });

    it('renders max unavailable and max surge inputs as enabled', () => {
      const maxUnavailableInput = screen.getByTestId('max-unavailable-input');
      const maxSurgeInput = screen.getByTestId('max-surge-input');

      expect(maxUnavailableInput).toBeVisible();
      expect(maxSurgeInput).toBeVisible();
      expect(maxUnavailableInput).not.toBeDisabled();
      expect(maxSurgeInput).not.toBeDisabled();
    });

    it('displays current values in input fields', () => {
      const maxUnavailableInput = screen.getByTestId('max-unavailable-input');
      const maxSurgeInput = screen.getByTestId('max-surge-input');

      expect(maxUnavailableInput).toHaveValue('25%');
      expect(maxSurgeInput).toHaveValue('25%');
    });

    it('calls onChangeMaxUnavailable when input changes', () => {
      const maxUnavailableInput = screen.getByTestId('max-unavailable-input');

      fireEvent.change(maxUnavailableInput, { target: { value: '50%' } });

      expect(mockProps.onChangeMaxUnavailable).toHaveBeenCalledWith('50%');
    });

    it('calls onChangeMaxSurge when input changes', () => {
      const maxSurgeInput = screen.getByTestId('max-surge-input');

      fireEvent.change(maxSurgeInput, { target: { value: '1' } });

      expect(mockProps.onChangeMaxSurge).toHaveBeenCalledWith('1');
    });
  });

  describe('Recreate strategy', () => {
    beforeEach(() => {
      renderWithProviders(<ConfigureUpdateStrategy {...mockProps} strategyType="Recreate" />);
    });

    it('shows recreate strategy as selected', () => {
      const rollingUpdateRadio = screen.getByTestId('rolling-update-strategy-radio');
      const recreateRadio = screen.getByTestId('recreate-update-strategy-radio');

      expect(rollingUpdateRadio).toBeVisible();
      expect(recreateRadio).toBeVisible();
      expect(recreateRadio).toBeChecked();
      expect(rollingUpdateRadio).not.toBeChecked();
    });

    it('disables max unavailable and max surge inputs', () => {
      const maxUnavailableInput = screen.getByTestId('max-unavailable-input');
      const maxSurgeInput = screen.getByTestId('max-surge-input');

      expect(maxUnavailableInput).toBeDisabled();
      expect(maxSurgeInput).toBeDisabled();
    });
  });

  describe('strategy switching', () => {
    it('calls onChangeStrategyType when switching to rolling update', () => {
      renderWithProviders(<ConfigureUpdateStrategy {...mockProps} strategyType="Recreate" />);

      const rollingUpdateRadio = screen.getByTestId('rolling-update-strategy-radio');
      fireEvent.click(rollingUpdateRadio);

      expect(mockProps.onChangeStrategyType).toHaveBeenCalledWith('RollingUpdate');
    });

    it('calls onChangeStrategyType when switching to recreate', () => {
      renderWithProviders(<ConfigureUpdateStrategy {...mockProps} strategyType="RollingUpdate" />);

      const recreateRadio = screen.getByTestId('recreate-update-strategy-radio');
      fireEvent.click(recreateRadio);

      expect(mockProps.onChangeStrategyType).toHaveBeenCalledWith('Recreate');
    });
  });
});
