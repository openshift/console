import { RuleStates } from '@console/internal/components/monitoring/types';
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
    alertRules[0].state = RuleStates.Inactive;
    const rows = monitoringAlertRows(alertRules, [''], 'ns');
    expect(rows[0].isOpen).toBe(undefined);
  });
});
