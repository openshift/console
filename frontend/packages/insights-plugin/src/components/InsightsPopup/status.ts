import * as _ from 'lodash';
import { PrometheusHealthHandler, SubsystemHealth } from '@console/plugin-sdk';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { mapMetrics, isInitialized, isUnavailable } from './mappers';

export const getClusterInsightsComponentStatus = (
  response: PrometheusResponse,
  error,
): SubsystemHealth => {
  if (error) {
    return {
      state: HealthState.NOT_AVAILABLE,
      message: 'Not available',
    };
  }
  if (!response) {
    return { state: HealthState.LOADING };
  }
  const values = mapMetrics(response);

  // Insights Operator is either not initialized, disabled or an error occurred
  if (isUnavailable(values)) {
    return { state: HealthState.UNKNOWN, message: 'Not available' };
  }
  // Insights Operator has been just initialized
  if (isInitialized(values)) {
    return { state: HealthState.PROGRESS, message: 'Issues pending' };
  }
  // Insights Operator has sent rules results
  const issuesNumber = Object.values(values).reduce((acc, cur) => acc + cur, 0);
  const issueStr = `${issuesNumber} ${issuesNumber === 1 ? 'issue' : 'issues'} found`;
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
