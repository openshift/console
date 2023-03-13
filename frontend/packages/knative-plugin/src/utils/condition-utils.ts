import * as _ from 'lodash';
import { K8sResourceCondition, K8sResourceConditionStatus } from '@console/internal/module/k8s';

export const getConditionOKCount = (conditions: K8sResourceCondition[]): number =>
  _.sumBy<any>(conditions, (c) => Number(c.status === K8sResourceConditionStatus.True));

export const getConditionString = (conditions: K8sResourceCondition[]): string =>
  `${getConditionOKCount(conditions)} OK / ${_.size(conditions)}`;

export const getCondition = (
  conditions: K8sResourceCondition[],
  type: K8sResourceCondition['type'],
): K8sResourceCondition | undefined => _.find(conditions, (c) => c.type === type);
