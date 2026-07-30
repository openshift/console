import { render, screen } from '@testing-library/react';
import DisruptionsAllowed from '../DisruptionsAllowed';
import type { PodDisruptionBudgetKind } from '../types';
import * as getPdbResourcesModule from '../utils/get-pdb-resources';

jest.mock('../utils/get-pdb-resources', () => ({
  isDisruptionViolated: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk'),
  YellowExclamationTriangleIcon: jest.fn(() => 'Disruption warning'),
}));

const mockIsDisruptionViolated = getPdbResourcesModule.isDisruptionViolated as jest.Mock;

describe('DisruptionsAllowed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockPdb = (disruptionsAllowed: number): PodDisruptionBudgetKind =>
    ({
      apiVersion: 'policy/v1',
      kind: 'PodDisruptionBudget',
      metadata: {
        name: 'test-pdb',
        namespace: 'default',
      },
      spec: {
        selector: { matchLabels: { app: 'test' } },
      },
      status: {
        conditions: [],
        disruptionsAllowed,
        currentHealthy: 3,
        desiredHealthy: 2,
        expectedPods: 3,
      },
    } as PodDisruptionBudgetKind);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display the number of disruptions allowed', () => {
    mockIsDisruptionViolated.mockReturnValue(false);
    const pdb = createMockPdb(2);

    render(<DisruptionsAllowed pdb={pdb} />);

    expect(screen.getByText('2')).toBeVisible();
  });

  it('should display zero disruptions allowed', () => {
    mockIsDisruptionViolated.mockReturnValue(false);
    const pdb = createMockPdb(0);

    render(<DisruptionsAllowed pdb={pdb} />);

    expect(screen.getByText('0')).toBeVisible();
  });

  it('should show warning icon when disruption is violated', () => {
    mockIsDisruptionViolated.mockReturnValue(true);
    const pdb = createMockPdb(0);

    render(<DisruptionsAllowed pdb={pdb} />);

    expect(screen.getByText('0')).toBeVisible();
    expect(screen.getByText('Disruption warning')).toBeVisible();
  });

  it('should not show warning icon when disruption is not violated', () => {
    mockIsDisruptionViolated.mockReturnValue(false);
    const pdb = createMockPdb(1);

    render(<DisruptionsAllowed pdb={pdb} />);

    expect(screen.queryByText('Disruption warning')).not.toBeInTheDocument();
  });

  it('should pass pdb to isDisruptionViolated', () => {
    mockIsDisruptionViolated.mockReturnValue(false);
    const pdb = createMockPdb(5);

    render(<DisruptionsAllowed pdb={pdb} />);

    expect(mockIsDisruptionViolated).toHaveBeenCalledWith(pdb);
  });
});
