import { render, screen } from '@testing-library/react';
import type { PrometheusResponse } from '@console/internal/components/graphs';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import ControlPlanePopup from '../ControlPlaneStatus';
import { getControlPlaneComponentHealth } from '../status';

jest.mock('../status', () => ({
  ...jest.requireActual('../status'),
  getControlPlaneComponentHealth: jest.fn(),
}));

const mockGetControlPlaneComponentHealth = getControlPlaneComponentHealth as jest.Mock;

describe('ControlPlanePopup', () => {
  const createMockResponse = (value: string): { response: PrometheusResponse; error: null } => ({
    response: {
      status: 'success',
      data: {
        resultType: 'vector',
        result: [{ metric: {}, value: [Date.now() / 1000, value] }],
      },
    },
    error: null,
  });

  const createMockResponses = (count: number) =>
    Array(count)
      .fill(null)
      .map(() => createMockResponse('0.99'));

  const defaultProps = {
    responses: createMockResponses(4),
    hide: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetControlPlaneComponentHealth.mockImplementation((response, error) => {
      if (error) {
        return { state: HealthState.NOT_AVAILABLE, message: 'Not available' };
      }
      if (!response) {
        return { state: HealthState.LOADING };
      }
      return { state: HealthState.OK, message: '99%' };
    });
  });

  it('should render control plane description', () => {
    render(<ControlPlanePopup {...defaultProps} />);

    expect(
      screen.getByText(
        'Components of the control plane are responsible for maintaining and reconciling the state of the cluster.',
      ),
    ).toBeVisible();
  });

  it.each([
    ['Components', 'column header'],
    ['Response rate', 'column header'],
    ['API Servers', 'component status'],
    ['Controller Managers', 'component status'],
    ['Schedulers', 'component status'],
    ['API Request Success Rate', 'component status'],
  ])('should render %s %s', (text) => {
    render(<ControlPlanePopup {...defaultProps} />);

    expect(screen.getByText(text)).toBeVisible();
  });
});
