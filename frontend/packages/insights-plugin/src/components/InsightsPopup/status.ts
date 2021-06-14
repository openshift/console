import i18next from 'i18next';
import * as _ from 'lodash';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { PrometheusHealthHandler, SubsystemHealth } from '@console/plugin-sdk';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { mapMetrics, isError, isWaitingOrDisabled } from './mappers';

export const getClusterInsightsComponentStatus = (
  response: PrometheusResponse,
  error,
): SubsystemHealth => {
  if (error) {
    return {
      state: HealthState.NOT_AVAILABLE,
      message: i18next.t('insights-plugin~Not available'),
    };
  }
  if (!response) {
    return { state: HealthState.LOADING };
  }
  const values = mapMetrics(response);

  if (isError(values)) {
    return { state: HealthState.ERROR, message: i18next.t('insights-plugin~Not available') };
  }

  if (!isError(values) && isWaitingOrDisabled(values)) {
    return { state: HealthState.UNKNOWN, message: i18next.t('insights-plugin~Not available') };
  }

  // Insights Operator has sent rules results
  const issuesNumber = Object.values(values).reduce((acc, cur) => acc + cur, 0);
  const issueStr =
    issuesNumber === 1
      ? i18next.t('insights-plugin~{{issuesNumber}} issue found', { issuesNumber })
      : i18next.t('insights-plugin~{{issuesNumber}} issues found', { issuesNumber });
  if (values.critical > 0) {
    return { state: HealthState.ERROR, message: issueStr };
  }
  if (issuesNumber > 0) {
    return { state: HealthState.WARNING, message: issueStr };
  }
  return { state: HealthState.OK, message: issueStr };
};

export const getClusterInsightsStatus: PrometheusHealthHandler = (responses, t, cluster) => {
  const componentHealth = getClusterInsightsComponentStatus(
    responses[0].response,
    responses[0].error,
  );
  if (componentHealth.state === HealthState.LOADING || !_.get(cluster, 'loaded')) {
    return { state: HealthState.LOADING };
  }

  return componentHealth;
};
