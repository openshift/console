import { render, screen } from '@testing-library/react';
import AvailabilityRequirement from '../AvailabilityRequirement';
import type { PodDisruptionBudgetKind } from '../types';

describe('AvailabilityRequirement', () => {
  const basePdb: PodDisruptionBudgetKind = {
    apiVersion: 'policy/v1',
    kind: 'PodDisruptionBudget',
    metadata: {
      name: 'test-pdb',
      namespace: 'default',
    },
    spec: {
      selector: { matchLabels: { app: 'test' } },
    },
  };

  it('should display minAvailable message when minAvailable is set', () => {
    const pdb: PodDisruptionBudgetKind = {
      ...basePdb,
      spec: {
        ...basePdb.spec,
        minAvailable: 2,
      },
    };

    render(<AvailabilityRequirement pdb={pdb} replicas={3} />);

    expect(screen.getByText(/Min available 2 of 3 pod/)).toBeVisible();
  });

  it('should display maxUnavailable message when maxUnavailable is set', () => {
    const pdb: PodDisruptionBudgetKind = {
      ...basePdb,
      spec: {
        ...basePdb.spec,
        maxUnavailable: 1,
      },
    };

    render(<AvailabilityRequirement pdb={pdb} replicas={5} />);

    expect(screen.getByText(/Max unavailable 1 of 5 pod/)).toBeVisible();
  });

  it('should handle percentage values for minAvailable', () => {
    const pdb: PodDisruptionBudgetKind = {
      ...basePdb,
      spec: {
        ...basePdb.spec,
        minAvailable: '50%',
      },
    };

    render(<AvailabilityRequirement pdb={pdb} replicas={4} />);

    expect(screen.getByText(/Min available 50% of 4 pod/)).toBeVisible();
  });

  it('should handle percentage values for maxUnavailable', () => {
    const pdb: PodDisruptionBudgetKind = {
      ...basePdb,
      spec: {
        ...basePdb.spec,
        maxUnavailable: '25%',
      },
    };

    render(<AvailabilityRequirement pdb={pdb} replicas={8} />);

    expect(screen.getByText(/Max unavailable 25% of 8 pod/)).toBeVisible();
  });

  it('should prefer minAvailable over maxUnavailable when both are set', () => {
    const pdb: PodDisruptionBudgetKind = {
      ...basePdb,
      spec: {
        ...basePdb.spec,
        minAvailable: 3,
        maxUnavailable: 1,
      },
    };

    render(<AvailabilityRequirement pdb={pdb} replicas={4} />);

    expect(screen.getByText(/Min available 3 of 4 pod/)).toBeVisible();
    expect(screen.queryByText(/Max unavailable/)).not.toBeInTheDocument();
  });

  it('should handle single replica', () => {
    const pdb: PodDisruptionBudgetKind = {
      ...basePdb,
      spec: {
        ...basePdb.spec,
        minAvailable: 1,
      },
    };

    render(<AvailabilityRequirement pdb={pdb} replicas={1} />);

    expect(screen.getByText(/Min available 1 of 1 pod/)).toBeVisible();
  });
});
