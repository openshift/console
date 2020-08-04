import {
  mockAlerts,
  mockAlerts2,
  expectedFiringAlerts,
} from '@console/shared/src/utils/__mocks__/alerts-and-rules-data';
import { AlertSeverity } from '@console/internal/components/monitoring/types';
import {
  getSeverityAlertType,
  getFiringAlerts,
  shouldHideMonitoringAlertDecorator,
} from '../alert-utils';

describe('alert-utils', () => {
  it('should get firing alerts', () => {
    const firingAlerts = getFiringAlerts(mockAlerts.data);
    expect(firingAlerts).toEqual(expectedFiringAlerts);
  });

  it('should fetch the severity of the most important alert', () => {
    const severityAlertType = getSeverityAlertType(mockAlerts.data);
    expect(severityAlertType).toEqual(AlertSeverity.Critical);
  });
  it('should hide monitoring alert decorator for alerts having severity as info/none', () => {
    const severityAlertType = getSeverityAlertType(mockAlerts2);
    const hideMonitoringAlertDecorator = shouldHideMonitoringAlertDecorator(severityAlertType);
    expect(hideMonitoringAlertDecorator).toBe(true);
  });
});
