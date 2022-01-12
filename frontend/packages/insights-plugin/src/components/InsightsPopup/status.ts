import i18next from 'i18next';
import * as _ from 'lodash';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { PrometheusHealthHandler, SubsystemHealth } from '@console/plugin-sdk';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { mapMetrics, isError, isWaiting, isDisabled } from './mappers';

const getClusterInsightsComponentStatus = (
  responses: {
    response: PrometheusResponse;
    error: any;
  }[],
): SubsystemHealth => {
  const [
    { response: metricsResponse, error: metricsError },
    { response: operatorStatusResponse, error: operatorStatusError },
  ] = responses;
  const operatorDisabled = isDisabled(operatorStatusResponse);

  // Unexpected error
  if (metricsError || operatorStatusError) {
    return {
      state: HealthState.NOT_AVAILABLE,
      message: i18next.t('insights-plugin~Not available'),
    };
  }
  // Insights Operator is disabled
  if (operatorDisabled) {
    return {
      state: HealthState.WARNING,
      message: i18next.t('insights-plugin~Disabled'),
    };
  }
  // Initializing Insights Operator
  if (!metricsResponse || !operatorStatusResponse) {
    return {
      state: HealthState.PROGRESS,
      message: i18next.t('insights-plugin~Issues pending'),
    };
  }
  const values = mapMetrics(metricsResponse);
  // Malformed metrics values
  if (isError(values)) {
    return {
      state: HealthState.NOT_AVAILABLE,
      message: i18next.t('insights-plugin~Not available'),
    };
  }
  // Waiting for the first results
  if (!isError(values) && isWaiting(values)) {
    return {
      state: HealthState.PROGRESS,
      message: i18next.t('insights-plugin~Issues pending'),
    };
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
  // Extra state for not yet loaded cluster
  if (!_.get(cluster, 'loaded')) {
    return {
      state: HealthState.LOADING,
    };
  }
  return getClusterInsightsComponentStatus(responses);
};
