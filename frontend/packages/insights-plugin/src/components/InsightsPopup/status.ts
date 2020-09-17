import { ResourceHealthHandler } from '@console/plugin-sdk';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { K8sResourceCommon } from '@console/internal/module/k8s';

export type InsightsOperator = {
  spec: {
    critical: number;
    important: number;
    low: number;
    moderate: number;
  };
} & K8sResourceCommon;

export const getClusterInsightsStatus: ResourceHealthHandler<{
  insightsReport: InsightsOperator;
}> = ({ insightsReport }) => {
  const { data, loaded, loadError } = insightsReport;

  if (loadError) {
    return { state: HealthState.UNKNOWN, message: 'Not available' };
  }
  if (!loaded) {
    return { state: HealthState.LOADING, message: 'Scanning in progress' };
  }
  const issuesNumber = Object.values(data.spec).reduce((acc, cur) => acc + cur, 0);
  const issueStr = `${issuesNumber} issues found`;
  if (data.spec.critical > 0) {
    return { state: HealthState.ERROR, message: issueStr };
  }
  if (issuesNumber > 0) {
    return { state: HealthState.WARNING, message: issueStr };
  }
  return { state: HealthState.OK, message: issueStr };
};
