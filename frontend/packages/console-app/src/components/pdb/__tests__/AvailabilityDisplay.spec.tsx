import { render, screen } from '@testing-library/react';
import AvailabilityDisplay from '../AvailabilityDisplay';
import type { PodDisruptionBudgetKind } from '../types';

describe('AvailabilityDisplay', () => {
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

  it('should display dash when neither minAvailable nor maxUnavailable is set', () => {
    render(<AvailabilityDisplay pdb={basePdb} />);

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should display minAvailable when only minAvailable is set', () => {
    const pdb: PodDisruptionBudgetKind = {
      ...basePdb,
      spec: {
        ...basePdb.spec,
        minAvailable: 2,
      },
    };

    render(<AvailabilityDisplay pdb={pdb} />);

    expect(screen.getByText(/Min available 2/)).toBeVisible();
  });

  it('should display maxUnavailable when only maxUnavailable is set', () => {
    const pdb: PodDisruptionBudgetKind = {
      ...basePdb,
      spec: {
        ...basePdb.spec,
        maxUnavailable: 1,
      },
    };

    render(<AvailabilityDisplay pdb={pdb} />);

    expect(screen.getByText(/Max unavailable 1/)).toBeVisible();
  });

  it('should display maxUnavailable when both are set (maxUnavailable takes precedence)', () => {
    const pdb: PodDisruptionBudgetKind = {
      ...basePdb,
      spec: {
        ...basePdb.spec,
        minAvailable: 3,
        maxUnavailable: 1,
      },
    };

    render(<AvailabilityDisplay pdb={pdb} />);

    // Logic: if maxUnavailable is not nil, show maxUnavailable
    expect(screen.getByText(/Max unavailable 1/)).toBeVisible();
  });

  it('should handle percentage values', () => {
    const pdb: PodDisruptionBudgetKind = {
      ...basePdb,
      spec: {
        ...basePdb.spec,
        minAvailable: '50%',
      },
    };

    render(<AvailabilityDisplay pdb={pdb} />);

    expect(screen.getByText(/Min available 50%/)).toBeVisible();
  });

  it('should handle string number values', () => {
    const pdb: PodDisruptionBudgetKind = {
      ...basePdb,
      spec: {
        ...basePdb.spec,
        maxUnavailable: '2',
      },
    };

    render(<AvailabilityDisplay pdb={pdb} />);

    expect(screen.getByText(/Max unavailable 2/)).toBeVisible();
  });
});
