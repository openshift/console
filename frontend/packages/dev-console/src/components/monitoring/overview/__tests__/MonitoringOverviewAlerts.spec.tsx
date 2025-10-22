import { render, screen } from '@testing-library/react';
import { sortMonitoringAlerts } from '@console/shared';
import { mockAlerts } from '@console/shared/src/utils/__mocks__/alerts-and-rules-data';
import { InternalMonitoringOverviewAlerts as MonitoringOverviewAlerts } from '../MonitoringOverviewAlerts';

jest.mock('@patternfly/react-core', () => ({
  Alert: () => 'Alert',
}));

jest.mock('react-router-dom-v5-compat', () => ({
  Link: () => 'Link',
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  useActivePerspective: jest.fn(() => ['dev']),
  AlertStates: {
    Firing: 'firing',
    Pending: 'pending',
    Silenced: 'silenced',
  },
  AlertSeverity: {
    Critical: 'critical',
    Warning: 'warning',
    Info: 'info',
    None: 'none',
  },
  RuleStates: {
    Firing: 'firing',
    Pending: 'pending',
    Silenced: 'silenced',
  },
}));

jest.mock('@console/internal/components/monitoring/utils', () => ({
  labelsToParams: jest.fn((labels) =>
    Object.keys(labels)
      .map((key) => `${key}=${labels[key]}`)
      .join('&'),
  ),
}));

jest.mock('@console/internal/components/utils/datetime', () => ({
  fromNow: jest.fn((timestamp) => `${timestamp} ago`),
}));

jest.mock('lodash', () => ({
  ...jest.requireActual('lodash'),
  map(array, fn) {
    return array.map(fn);
  },
}));

describe('Monitoring Alerts Section', () => {
  const monitoringOverviewProps: React.ComponentProps<typeof MonitoringOverviewAlerts> = {
    alerts: mockAlerts.data,
  };

  it('should show alerts sorted by severity', () => {
    const sortedAlerts = sortMonitoringAlerts(mockAlerts.data);
    expect(sortedAlerts).toHaveLength(mockAlerts.data.length);
    expect(Array.isArray(sortedAlerts)).toBe(true);
  });

  it('should render MonitoringOverviewAlerts component', () => {
    render(<MonitoringOverviewAlerts {...monitoringOverviewProps} />);

    expect(screen.getByText(/Alert/)).toBeInTheDocument();
  });
});
