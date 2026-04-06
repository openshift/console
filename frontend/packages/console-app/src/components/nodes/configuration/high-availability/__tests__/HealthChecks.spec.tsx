// Assisted-by: Claude
import { render, screen } from '@testing-library/react';
import type { MachineHealthCheckKind } from '@console/internal/module/k8s';
import type { NodeHealthCheckKind } from '../../../utils/HealthCheckUtils';
import HealthChecks from '../HealthChecks';

// Mock components
jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: ({ name }: { name: string }) => <span>{name}</span>,
}));

jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: ({ timestamp }: { timestamp?: string }) => <span>{timestamp || '-'}</span>,
}));

// Mock utility functions
const mockGetMachineHealthCheckScope = jest.fn();
const mockGetNodeHealthCheckScope = jest.fn();
const mockFormatHealthCheckSelector = jest.fn();
const mockFormatUnhealthyConditionsDisplay = jest.fn();

jest.mock('../../../utils/HealthCheckUtils', () => ({
  getMachineHealthCheckScope: (...args: any[]) => mockGetMachineHealthCheckScope(...args),
  getNodeHealthCheckScope: (...args: any[]) => mockGetNodeHealthCheckScope(...args),
  formatHealthCheckSelector: (...args: any[]) => mockFormatHealthCheckSelector(...args),
  formatUnhealthyConditionsDisplay: (...args: any[]) =>
    mockFormatUnhealthyConditionsDisplay(...args),
  NodeHealthCheckModel: {
    kind: 'NodeHealthCheck',
    id: 'nodehealthcheck',
  },
}));

describe('HealthChecks', () => {
  const mockMachineHealthCheck: MachineHealthCheckKind & {
    status?: { [key: string]: any };
  } = {
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
    status: {
      lastUpdateTime: '2024-03-01T10:00:00Z',
    },
  };

  const mockNodeHealthCheck: NodeHealthCheckKind = {
    apiVersion: 'remediation.medik8s.io/v1alpha1',
    kind: 'NodeHealthCheck',
    metadata: {
      name: 'test-nhc',
    },
    spec: {
      selector: {},
      unhealthyConditions: [
        {
          type: 'Ready',
          status: 'Unknown',
          duration: '180s',
        },
      ],
    },
    status: {
      lastUpdateTime: '2024-03-01T11:00:00Z',
    },
  };

  beforeEach(() => {
    mockGetMachineHealthCheckScope.mockReturnValue('All machines');
    mockGetNodeHealthCheckScope.mockReturnValue('Cluster-wide');
    mockFormatHealthCheckSelector.mockReturnValue('app=test');
    mockFormatUnhealthyConditionsDisplay.mockReturnValue('Ready=False for 5m');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the health checks heading', () => {
    render(
      <HealthChecks
        matchingMachineHealthChecks={[]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Machine/Node health checks' })).toBeVisible();
  });

  it('should show loading skeleton when isLoading is true', () => {
    render(
      <HealthChecks matchingMachineHealthChecks={[]} matchingNodeHealthChecks={[]} isLoading />,
    );

    expect(screen.getByText('Machine/Node health checks')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should display error message when loadError is present', () => {
    render(
      <HealthChecks
        matchingMachineHealthChecks={[]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
        loadError={new Error('Failed to load')}
      />,
    );

    expect(screen.getByText('Unable to load health checks')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should show empty state when no health checks match', () => {
    render(
      <HealthChecks
        matchingMachineHealthChecks={[]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByText('No matching MachineHealthChecks or NodeHealthChecks')).toBeVisible();
  });

  it('should display MachineHealthCheck in the table', () => {
    render(
      <HealthChecks
        matchingMachineHealthChecks={[mockMachineHealthCheck]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByText('test-mhc')).toBeVisible();
    expect(screen.getByText('All machines')).toBeVisible();
    expect(screen.getByText('app=test')).toBeVisible();
    expect(screen.getByText('Ready=False for 5m')).toBeVisible();
    expect(screen.getByText('2024-03-01T10:00:00Z')).toBeVisible();
  });

  it('should display NodeHealthCheck in the table', () => {
    render(
      <HealthChecks
        matchingMachineHealthChecks={[]}
        matchingNodeHealthChecks={[mockNodeHealthCheck]}
        isLoading={false}
      />,
    );

    expect(screen.getByText('test-nhc')).toBeVisible();
    expect(screen.getByText('Cluster-wide')).toBeVisible();
    expect(screen.getByText('app=test')).toBeVisible();
    expect(screen.getByText('Ready=False for 5m')).toBeVisible();
    expect(screen.getByText('2024-03-01T11:00:00Z')).toBeVisible();
  });

  it('should display all table column headers', () => {
    render(
      <HealthChecks
        matchingMachineHealthChecks={[mockMachineHealthCheck]}
        matchingNodeHealthChecks={[]}
        isLoading={false}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Scope' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Selector' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Unhealthy conditions' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Last triggered' })).toBeVisible();
  });
});
