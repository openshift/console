import { AlertStates } from '@console/internal/components/monitoring/types';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { rules } from '@console/shared/src/utils/__mocks__/alerts-and-rules-data';
import { monitoringAlertRows } from '../monitoring-alerts-utils';

describe('monitoring-alerts-utils', () => {
  it('row should be expanded if rule state is FIRING', () => {
    const alertRules = getAlertsAndRules(rules?.data).rules;
    const rows = monitoringAlertRows(alertRules, [alertRules[1].id], 'ns');
    expect(rows[0].isOpen).toBe(true);
  });
  it('row should be collapsed if rule state is FIRING but collapsed by user', () => {
    const alertRules = getAlertsAndRules(rules?.data).rules;
    const rows = monitoringAlertRows(alertRules, [alertRules[0].id], 'ns');
    expect(rows[0].isOpen).toBe(false);
  });
  it('row should be collapse if rule state is not FIRING', () => {
    const alertRules = getAlertsAndRules(rules?.data).rules;
    alertRules[1].alerts[0].state = AlertStates.NotFiring;
    const rows = monitoringAlertRows(alertRules, [''], 'ns');
    expect(rows[1].isOpen).toBe(undefined);
    alertRules[0].alerts[0].state = AlertStates.Pending;
    const rows1 = monitoringAlertRows(alertRules, [''], 'ns');
    expect(rows1[0].isOpen).toBe(false);
    alertRules[0].alerts[0].state = AlertStates.Firing;
    const rows2 = monitoringAlertRows(alertRules, [''], 'ns');
    expect(rows2[0].isOpen).toBe(true);
  });
});
