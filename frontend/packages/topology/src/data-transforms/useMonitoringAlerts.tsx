import * as React from 'react';
import { usePrometheusRulesPoll } from '@console/internal/components/graphs/prometheus-rules-hook';
import { Alert } from '@console/internal/components/monitoring/types';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { useDeepCompareMemoize } from '@console/shared';

export const useMonitoringAlerts = (
  namespace: string,
): {
  data: Alert[];
  loaded: boolean;
  loadError: string;
} => {
  const [alertsResponse, alertsError, alertsLoading] = usePrometheusRulesPoll({ namespace });
  const response = React.useMemo(() => {
    let alertData;
    if (!alertsLoading && !alertsError) {
      alertData = getAlertsAndRules(alertsResponse?.data).alerts;

      // Don't update due to time changes
      alertData.forEach((alert) => {
        delete alert.activeAt;
        if (alert.rule) {
          delete alert.rule.evaluationTime;
          delete alert.rule.lastEvaluation;
          alert.rule.alerts &&
            alert.rule.alerts.forEach((ruleAlert) => {
              delete ruleAlert.activeAt;
            });
        }
      });
    }
    return { data: alertData, loaded: !alertsLoading, loadError: alertsError };
  }, [alertsError, alertsLoading, alertsResponse]);

  return useDeepCompareMemoize(response);
};
