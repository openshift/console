import { K8sResourceKind, NodeKind } from '@console/internal/module/k8s';
import { getDeletetionTimestamp } from '@console/shared/src/selectors';
import { getNodeMaintenancePhase } from '../selectors';
import {
  HOST_STATUS_TITLES,
  HOST_STATUS_UNDER_MAINTENANCE,
  HOST_STATUS_STOPPING_MAINTENANCE,
  HOST_STATUS_STARTING_MAINTENANCE,
} from '../constants';
import { StatusProps } from '../components/types';

export const getNodeMaintenanceStatus = (
  maintenance: K8sResourceKind,
  node: NodeKind,
): StatusProps => {
  if (maintenance) {
    if (getDeletetionTimestamp(maintenance)) {
      return {
        status: HOST_STATUS_STOPPING_MAINTENANCE,
        title: HOST_STATUS_TITLES[HOST_STATUS_STOPPING_MAINTENANCE],
        maintenance,
        node,
      };
    }
    if (getNodeMaintenancePhase(maintenance) === 'Succeeded') {
      return {
        status: HOST_STATUS_UNDER_MAINTENANCE,
        title: HOST_STATUS_TITLES[HOST_STATUS_UNDER_MAINTENANCE],
        maintenance,
        node,
      };
    }
    return {
      status: HOST_STATUS_STARTING_MAINTENANCE,
      title: HOST_STATUS_TITLES[HOST_STATUS_STARTING_MAINTENANCE],
      maintenance,
      node,
    };
  }
  return null;
};
