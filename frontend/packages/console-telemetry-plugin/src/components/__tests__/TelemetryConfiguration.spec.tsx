import { render, screen } from '@testing-library/react';
import { useConsoleOperatorConfig } from '@console/shared/src/components/cluster-configuration/useConsoleOperatorConfig';
import TelemetryConfiguration from '../TelemetryConfiguration';

jest.mock('@console/shared/src/components/cluster-configuration/useConsoleOperatorConfig', () => ({
  useConsoleOperatorConfig: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: jest.fn(() => jest.fn()),
}));

const useConsoleOperatorConfigMock = useConsoleOperatorConfig as jest.Mock;

describe('TelemetryConfiguration', () => {
  it('selects the configured telemetry option when the operator config is already loaded on the first render', () => {
    // The operator config is typically already loaded when the page remounts;
    // there is no later loaded-transition to trigger the seeding.
    useConsoleOperatorConfigMock.mockReturnValue([
      {
        metadata: {
          annotations: { 'telemetry.console.openshift.io/STATE': 'DISABLED' },
        },
      },
      true,
      undefined,
    ]);

    render(<TelemetryConfiguration readonly={false} />);

    expect(screen.getByText('Disabled')).toBeVisible();
  });
});
