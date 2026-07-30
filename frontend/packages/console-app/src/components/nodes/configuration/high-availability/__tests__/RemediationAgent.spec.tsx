// Assisted-by: Claude
import { render, screen } from '@testing-library/react';
import type { MachineHealthCheckKind } from '@console/internal/module/k8s';
import RemediationAgent from '../RemediationAgent';

// Mock components
jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: ({ name }: { name: string }) => <span>{name}</span>,
}));

jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: ({ timestamp }: { timestamp?: string }) => <span>{timestamp || '-'}</span>,
}));

// Mock utility functions
const mockGetRemediationTemplateRefsFromHealthCheck = jest.fn();
const mockGetHealthCheckLastAction = jest.fn();

jest.mock('../../../utils/HighAvailabilityUtils', () => ({
  getRemediationTemplateRefsFromHealthCheck: (...args: any[]) =>
    mockGetRemediationTemplateRefsFromHealthCheck(...args),
}));

jest.mock('../../../utils/HealthCheckUtils', () => ({
  getHealthCheckLastAction: (...args: any[]) => mockGetHealthCheckLastAction(...args),
  NodeHealthCheckModel: {
    kind: 'NodeHealthCheck',
    id: 'nodehealthcheck',
  },
}));

describe('RemediationAgent', () => {
  const mockMachineHealthCheck: MachineHealthCheckKind = {
    apiVersion: 'machine.openshift.io/v1beta1',
    kind: 'MachineHealthCheck',
    metadata: {
      name: 'test-mhc',
      namespace: 'openshift-machine-api',
    },
    spec: {
      selector: {},
      unhealthyConditions: [],
    },
  };

  beforeEach(() => {
    mockGetRemediationTemplateRefsFromHealthCheck.mockReturnValue([]);
    mockGetHealthCheckLastAction.mockReturnValue('2024-03-01T10:00:00Z');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the remediation agents heading', () => {
    render(
      <RemediationAgent
        matchingMachineHealthChecks={[]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Node remediation agents' })).toBeVisible();
  });

  it('should show loading skeleton when isLoading is true', () => {
    render(
      <RemediationAgent matchingMachineHealthChecks={[]} matchingNodeHealthChecks={[]} isLoading />,
    );

    expect(screen.getByText('Node remediation agents')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should display error message when loadError is present', () => {
    render(
      <RemediationAgent
        matchingMachineHealthChecks={[]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
        loadError={new Error('Failed to load')}
      />,
    );

    expect(screen.getByText('Unable to load remediation agents')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should show empty state when no remediation templates exist', () => {
    render(
      <RemediationAgent
        matchingMachineHealthChecks={[mockMachineHealthCheck]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByText('No matching remediation agents found')).toBeVisible();
  });

  it('should display SNR remediation agent', () => {
    mockGetRemediationTemplateRefsFromHealthCheck.mockReturnValue([
      {
        kind: 'SelfNodeRemediationTemplate',
        name: 'snr-template',
        namespace: 'openshift-machine-api',
        apiVersion: 'self-node-remediation.medik8s.io/v1alpha1',
      },
    ]);

    render(
      <RemediationAgent
        matchingMachineHealthChecks={[mockMachineHealthCheck]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByText('SNR - Self node remediation')).toBeVisible();
    expect(screen.getByText('test-mhc')).toBeVisible();
    expect(screen.getByText('snr-template')).toBeVisible();
  });

  it('should display FAR remediation agent', () => {
    mockGetRemediationTemplateRefsFromHealthCheck.mockReturnValue([
      {
        kind: 'FenceAgentsRemediationTemplate',
        name: 'far-template',
        namespace: 'openshift-machine-api',
        apiVersion: 'fence-agents-remediation.medik8s.io/v1alpha1',
      },
    ]);

    render(
      <RemediationAgent
        matchingMachineHealthChecks={[mockMachineHealthCheck]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByText('FAR - Fence agents remediation')).toBeVisible();
    expect(screen.getByText('far-template')).toBeVisible();
  });

  it('should display MDR remediation agent', () => {
    mockGetRemediationTemplateRefsFromHealthCheck.mockReturnValue([
      {
        kind: 'Metal3RemediationTemplate',
        name: 'mdr-template',
        namespace: 'openshift-machine-api',
        apiVersion: 'infrastructure.cluster.x-k8s.io/v1beta1',
      },
    ]);

    render(
      <RemediationAgent
        matchingMachineHealthChecks={[mockMachineHealthCheck]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByText('MDR - Metal3-driven remediation')).toBeVisible();
    expect(screen.getByText('mdr-template')).toBeVisible();
  });

  it('should display dash when config ref is incomplete', () => {
    mockGetRemediationTemplateRefsFromHealthCheck.mockReturnValue([
      {
        kind: 'SelfNodeRemediationTemplate',
        // Missing name and apiVersion
      },
    ]);

    render(
      <RemediationAgent
        matchingMachineHealthChecks={[mockMachineHealthCheck]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    const cells = screen.getAllByRole('cell');
    expect(cells[2]).toHaveTextContent('-');
  });
});
