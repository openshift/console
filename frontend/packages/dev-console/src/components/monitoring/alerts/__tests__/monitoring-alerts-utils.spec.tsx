import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { monitoringAlertRows } from '../monitoring-alerts-utils';
import { rules } from './rules-mocks';
import { RuleStates } from '@console/internal/reducers/monitoring';

describe('monitoring-alerts-utils', () => {
  it('row should be expanded if rule state is FIRING', () => {
    const alertRules = getAlertsAndRules(rules?.data).rules;
    const rows = monitoringAlertRows(alertRules, ['KubeNodeReadinessFlapping']);
    expect(rows[0].isOpen).toBe(true);
  });
  it('row should be collapsed if rule state is FIRING but collapsed by user', () => {
    const alertRules = getAlertsAndRules(rules?.data).rules;
    const rows = monitoringAlertRows(alertRules, ['KubeNodeNotReady']);
    expect(rows[0].isOpen).toBe(false);
  });
  it('row should be collapse if rule state is not FIRING', () => {
    const alertRules = getAlertsAndRules(rules?.data).rules;
    alertRules[0].state = RuleStates.Inactive;
    const rows = monitoringAlertRows(alertRules, ['']);
    expect(rows[0].isOpen).toBe(undefined);
  });
});
