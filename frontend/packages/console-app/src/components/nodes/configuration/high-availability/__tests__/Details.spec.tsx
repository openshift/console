// Assisted-by: Claude
import { render, screen } from '@testing-library/react';
import type { MachineHealthCheckKind } from '@console/internal/module/k8s';
import Details from '../Details';

// Mock Status component
jest.mock('@console/dynamic-plugin-sdk/src/app/components/status/Status', () => ({
  __esModule: true,
  default: ({ status, title }: { status: string; title: string }) => (
    <span data-test="status-component">
      {status} - {title}
    </span>
  ),
}));

// Mock estimated recovery remediation module
const mockUseRemediationResourcesForEstimatedRecovery = jest.fn();
const mockGetRemediationTemplateRefsFromHealthChecks = jest.fn();

const mockGetRemediationDisplay = jest.fn();
const mockEstimatedRecoveryTimeDisplay = jest.fn();

jest.mock('../../../utils/HighAvailabilityUtils', () => ({
  useRemediationResourcesForEstimatedRecovery: () =>
    mockUseRemediationResourcesForEstimatedRecovery(),
  getRemediationTemplateRefsFromHealthChecks: (...args: any[]) =>
    mockGetRemediationTemplateRefsFromHealthChecks(...args),
  getRemediationDisplay: (...args: any[]) => mockGetRemediationDisplay(...args),
  estimatedRecoveryTimeDisplay: (...args: any[]) => mockEstimatedRecoveryTimeDisplay(...args),
}));

describe('Details', () => {
  const mockMachineHealthCheck: MachineHealthCheckKind = {
    apiVersion: 'machine.openshift.io/v1beta1',
    kind: 'MachineHealthCheck',
    metadata: {
      name: 'test-mhc',
      namespace: 'openshift-machine-api',
    },
    spec: {
      selector: {},
      unhealthyConditions: [
        {
          type: 'Ready',
          status: 'False',
          timeout: '300s',
        },
      ],
    },
  };

  beforeEach(() => {
    mockUseRemediationResourcesForEstimatedRecovery.mockReturnValue({
      snrConfigs: [],
      farTemplates: [],
      mdrTemplates: [],
      metal3Templates: [],
      loaded: true,
    });

    mockGetRemediationTemplateRefsFromHealthChecks.mockReturnValue([
      {
        kind: 'SelfNodeRemediationTemplate',
        name: 'test-template',
        namespace: 'openshift-machine-api',
      },
    ]);

    mockGetRemediationDisplay.mockReturnValue('MHC: machine replacement; Drain: 5m timeout');
    mockEstimatedRecoveryTimeDisplay.mockReturnValue('10-12 min');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the Details heading', () => {
    render(
      <Details matchingMachineHealthChecks={[]} matchingNodeHealthChecks={[]} isLoading={false} />,
    );

    expect(screen.getByRole('heading', { name: 'Details' })).toBeVisible();
  });

  it('should show loading skeletons when isLoading is true', () => {
    render(
      <Details
        matchingMachineHealthChecks={[mockMachineHealthCheck]}
        matchingNodeHealthChecks={[]}
        isLoading
      />,
    );

    expect(screen.getByTestId('status-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('remediation-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('recovery-time-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('status-component')).not.toBeInTheDocument();
  });

  it('should show loading skeletons when remediation resources are not loaded', () => {
    mockUseRemediationResourcesForEstimatedRecovery.mockReturnValue({
      snrConfigs: [],
      farTemplates: [],
      mdrTemplates: [],
      metal3Templates: [],
      loaded: false,
    });

    render(
      <Details
        matchingMachineHealthChecks={[mockMachineHealthCheck]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByTestId('status-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('remediation-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('recovery-time-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('status-component')).not.toBeInTheDocument();
  });

  it('should display error message when loadError is present', () => {
    render(
      <Details
        matchingMachineHealthChecks={[]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
        loadError={new Error('Failed to load')}
      />,
    );

    expect(screen.getByText('Unable to load high availability details')).toBeVisible();
    expect(screen.queryByRole('term', { name: 'Status' })).not.toBeInTheDocument();
  });

  it('should show Ready status when HA is configured with remediation templates', () => {
    render(
      <Details
        matchingMachineHealthChecks={[mockMachineHealthCheck]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByTestId('status-component')).toHaveTextContent('Ready - Ready');
  });

  it('should show Unavailable status when no remediation templates are configured', () => {
    mockGetRemediationTemplateRefsFromHealthChecks.mockReturnValue([]);

    render(
      <Details matchingMachineHealthChecks={[]} matchingNodeHealthChecks={[]} isLoading={false} />,
    );

    expect(screen.getByTestId('status-component')).toHaveTextContent('Unknown - Unavailable');
  });

  it('should display MHC machine replacement remediation with drain timeout', () => {
    render(
      <Details
        matchingMachineHealthChecks={[mockMachineHealthCheck]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByText('MHC: machine replacement; Drain: 5m timeout')).toBeVisible();
  });

  it('should display estimated recovery time when conditions are present', () => {
    render(
      <Details
        matchingMachineHealthChecks={[mockMachineHealthCheck]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    // Recovery time calculation: (50 + 300 + 15 + 180) / 60 to (50 + 300 + 15 + 300) / 60
    // = 545 / 60 = 10 min to 665 / 60 = 12 min
    expect(screen.getByText(/10-12 min/)).toBeVisible();
  });
});
