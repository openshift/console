import { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    it('has proper labels', () => {
      renderWithProviders(<ConfigureUpdateStrategy {...mockProps} strategyType="RollingUpdate" />);
      expect(screen.getByText('RollingUpdate (default)')).toBeVisible();
      expect(screen.getByText('Recreate')).toBeVisible();
      expect(screen.getByText('Max unavailable')).toBeVisible();
      expect(screen.getByText('Max surge')).toBeVisible();
    });

    it('shows rolling update strategy as selected', () => {
      renderWithProviders(<ConfigureUpdateStrategy {...mockProps} strategyType="RollingUpdate" />);
      const rollingUpdateRadio = screen.getByTestId('rolling-update-strategy-radio');
      const recreateRadio = screen.getByTestId('recreate-update-strategy-radio');

      expect(rollingUpdateRadio).toBeChecked();
      expect(recreateRadio).not.toBeChecked();
    });

    it('renders max unavailable and max surge inputs as enabled', () => {
      renderWithProviders(<ConfigureUpdateStrategy {...mockProps} strategyType="RollingUpdate" />);
      const maxUnavailableInput = screen.getByTestId('max-unavailable-input');
      const maxSurgeInput = screen.getByTestId('max-surge-input');

      expect(maxUnavailableInput).toBeVisible();
      expect(maxSurgeInput).toBeVisible();
      expect(maxUnavailableInput).not.toBeDisabled();
      expect(maxSurgeInput).not.toBeDisabled();
    });

    it('displays current values in input fields', () => {
      renderWithProviders(<ConfigureUpdateStrategy {...mockProps} strategyType="RollingUpdate" />);
      const maxUnavailableInput = screen.getByTestId('max-unavailable-input');
      const maxSurgeInput = screen.getByTestId('max-surge-input');

      expect(maxUnavailableInput).toHaveValue('25%');
      expect(maxSurgeInput).toHaveValue('25%');
    });

    it('calls onChangeMaxUnavailable when input changes', async () => {
      const user = userEvent.setup();

      const RollingUpdateInputsHarness = () => {
        const [maxUnavailable, setMaxUnavailable] = useState('25%');
        const [maxSurge, setMaxSurge] = useState('25%');
        return (
          <ConfigureUpdateStrategy
            {...mockProps}
            strategyType="RollingUpdate"
            maxUnavailable={maxUnavailable}
            maxSurge={maxSurge}
            onChangeMaxUnavailable={(v) => {
              setMaxUnavailable(String(v));
              mockProps.onChangeMaxUnavailable(v);
            }}
            onChangeMaxSurge={(v) => {
              setMaxSurge(String(v));
              mockProps.onChangeMaxSurge(v);
            }}
          />
        );
      };

      renderWithProviders(<RollingUpdateInputsHarness />);

      const maxUnavailableInput = screen.getByTestId('max-unavailable-input');

      await user.clear(maxUnavailableInput);
      await user.type(maxUnavailableInput, '50%');

      await waitFor(() => {
        expect(mockProps.onChangeMaxUnavailable).toHaveBeenLastCalledWith('50%');
      });
    });

    it('calls onChangeMaxSurge when input changes', async () => {
      const user = userEvent.setup();

      const RollingUpdateInputsHarness = () => {
        const [maxUnavailable, setMaxUnavailable] = useState('25%');
        const [maxSurge, setMaxSurge] = useState('25%');
        return (
          <ConfigureUpdateStrategy
            {...mockProps}
            strategyType="RollingUpdate"
            maxUnavailable={maxUnavailable}
            maxSurge={maxSurge}
            onChangeMaxUnavailable={(v) => {
              setMaxUnavailable(String(v));
              mockProps.onChangeMaxUnavailable(v);
            }}
            onChangeMaxSurge={(v) => {
              setMaxSurge(String(v));
              mockProps.onChangeMaxSurge(v);
            }}
          />
        );
      };

      renderWithProviders(<RollingUpdateInputsHarness />);

      const maxSurgeInput = screen.getByTestId('max-surge-input');

      await user.clear(maxSurgeInput);
      await user.type(maxSurgeInput, '1');

      await waitFor(() => {
        expect(mockProps.onChangeMaxSurge).toHaveBeenLastCalledWith('1');
      });
    });
  });

  describe('Recreate strategy', () => {
    it('shows recreate strategy as selected', () => {
      renderWithProviders(<ConfigureUpdateStrategy {...mockProps} strategyType="Recreate" />);
      const rollingUpdateRadio = screen.getByTestId('rolling-update-strategy-radio');
      const recreateRadio = screen.getByTestId('recreate-update-strategy-radio');

      expect(rollingUpdateRadio).toBeVisible();
      expect(recreateRadio).toBeVisible();
      expect(recreateRadio).toBeChecked();
      expect(rollingUpdateRadio).not.toBeChecked();
    });

    it('disables max unavailable and max surge inputs', () => {
      renderWithProviders(<ConfigureUpdateStrategy {...mockProps} strategyType="Recreate" />);
      const maxUnavailableInput = screen.getByTestId('max-unavailable-input');
      const maxSurgeInput = screen.getByTestId('max-surge-input');

      expect(maxUnavailableInput).toBeDisabled();
      expect(maxSurgeInput).toBeDisabled();
    });
  });

  describe('strategy switching', () => {
    it('calls onChangeStrategyType when switching to rolling update', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ConfigureUpdateStrategy {...mockProps} strategyType="Recreate" />);

      const rollingUpdateRadio = screen.getByTestId('rolling-update-strategy-radio');
      await user.click(rollingUpdateRadio);

      expect(mockProps.onChangeStrategyType).toHaveBeenCalledWith('RollingUpdate');
    });

    it('calls onChangeStrategyType when switching to recreate', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ConfigureUpdateStrategy {...mockProps} strategyType="RollingUpdate" />);

      const recreateRadio = screen.getByTestId('recreate-update-strategy-radio');
      await user.click(recreateRadio);

      expect(mockProps.onChangeStrategyType).toHaveBeenCalledWith('Recreate');
    });
  });
});
