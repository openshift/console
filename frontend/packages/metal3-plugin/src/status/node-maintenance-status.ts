import { K8sResourceKind } from '@console/internal/module/k8s';
import { getDeletetionTimestamp } from '@console/shared/src/selectors';
import { getNodeMaintenancePhase } from '../selectors';
import {
  NODE_STATUS_TITLES,
  NODE_STATUS_UNDER_MAINTENANCE,
  NODE_STATUS_STOPPING_MAINTENANCE,
  NODE_STATUS_STARTING_MAINTENANCE,
} from '../constants';
import { StatusProps } from '../components/types';

export const getNodeMaintenanceStatus = (maintenance: K8sResourceKind): StatusProps => {
  if (!maintenance) return null;

  if (getDeletetionTimestamp(maintenance)) {
    return {
      status: NODE_STATUS_STOPPING_MAINTENANCE,
      title: NODE_STATUS_TITLES[NODE_STATUS_STOPPING_MAINTENANCE],
    };
  }
  if (getNodeMaintenancePhase(maintenance) === 'Succeeded') {
    return {
      status: NODE_STATUS_UNDER_MAINTENANCE,
      title: NODE_STATUS_TITLES[NODE_STATUS_UNDER_MAINTENANCE],
    };
  }
  return {
    status: NODE_STATUS_STARTING_MAINTENANCE,
    title: NODE_STATUS_TITLES[NODE_STATUS_STARTING_MAINTENANCE],
  };
};
