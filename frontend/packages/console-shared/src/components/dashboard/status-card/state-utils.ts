import * as _ from 'lodash';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import {
  OperatorStatusWithResources,
  OperatorHealth,
  GetOperatorStatusPriority,
} from '@console/plugin-sdk';
import { healthPriority, HealthState } from './states';

export const getMostImportantStatuses = (
  operatorStatuses: OperatorStatusWithResources[],
): OperatorStatusWithResources[] => {
  const mostImportantStatus = Math.max(...operatorStatuses.map(({ status }) => status.priority));
  return operatorStatuses.filter(({ status }) => status.priority === mostImportantStatus);
};

export const getOperatorsStatus = <R extends K8sResourceCommon>(
  operators: R[],
  getOperatorStatus: GetOperatorStatusPriority<R>,
): OperatorStatusWithResources<R> => {
  if (!operators.length) {
    return {
      status: {
        ...healthPriority[HealthState.OK],
        title: 'Available',
      },
      operators: [],
    };
  }
  const operatorsByStatus: { [key: string]: OperatorStatusWithResources<R> } = operators.reduce(
    (acc, o) => {
      const status = getOperatorStatus(o);
      if (!acc[status.health]) {
        acc[status.health] = {
          status: {
            ...status,
          },
          operators: [o],
        };
      } else {
        acc[status.health].operators.push(o);
      }
      return acc;
    },
    {},
  );

  const mostImportantStatus = Object.keys(operatorsByStatus).sort(
    (a, b) => operatorsByStatus[b].status.priority - operatorsByStatus[a].status.priority,
  )[0];

  return operatorsByStatus[mostImportantStatus];
};

export const getOperatorsHealthState = (
  healthStatuses: OperatorHealth[],
): { health: HealthState; detailMessage: string } => {
  if (healthStatuses.some((s) => s.health === HealthState.NOT_AVAILABLE)) {
    return { health: HealthState.NOT_AVAILABLE, detailMessage: undefined };
  }
  if (healthStatuses.some((s) => HealthState.LOADING === s.health)) {
    return { health: HealthState.LOADING, detailMessage: undefined };
  }
  const sortedStatuses = healthStatuses.sort(
    (a, b) => healthPriority[b.health].priority - healthPriority[a.health].priority,
  );
  const groupedStatuses = _.groupBy(sortedStatuses, (s) => s.health);
  const statusKeys = Object.keys(groupedStatuses);
  let finalCount = 0;
  groupedStatuses[statusKeys[0]].forEach((g) => {
    if (!_.isNil(g.count)) {
      finalCount += g.count;
    }
  });
  // warning and error statuses are counted together as degraded
  if (
    statusKeys.length > 1 &&
    statusKeys[0] === HealthState.ERROR &&
    statusKeys[1] === HealthState.WARNING
  ) {
    groupedStatuses[statusKeys[1]].forEach((g) => {
      if (!_.isNil(g.count)) {
        finalCount += g.count;
      }
    });
  }

  return {
    health: HealthState[statusKeys[0]],
    detailMessage: healthPriority[statusKeys[0]].message
      ? `${finalCount} ${healthPriority[statusKeys[0]].message.toLowerCase()}`
      : undefined,
  };
};
