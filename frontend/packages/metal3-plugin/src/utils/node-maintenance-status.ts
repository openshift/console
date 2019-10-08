import { K8sResourceKind } from '@console/internal/module/k8s';
import { getDeletetionTimestamp } from '@console/shared/src/selectors/common';
import { getNodeMaintenancePhase } from '../selectors';
import {
  HOST_STATUS_TITLES,
  HOST_STATUS_UNDER_MAINTENANCE,
  HOST_STATUS_STOPPING_MAINTENANCE,
  HOST_STATUS_STARTING_MAINTENANCE,
} from '../constants';
import { BareMetalHostKind } from '../types';

export const getNodeMaintenanceStatus = (maintenance: K8sResourceKind, host: BareMetalHostKind) => {
  if (maintenance) {
    if (getDeletetionTimestamp(maintenance)) {
      return {
        status: HOST_STATUS_STOPPING_MAINTENANCE,
        title: HOST_STATUS_TITLES[HOST_STATUS_STOPPING_MAINTENANCE],
        maintenance,
        host,
      };
    }
    if (getNodeMaintenancePhase(maintenance) === 'Succeeded') {
      return {
        status: HOST_STATUS_UNDER_MAINTENANCE,
        title: HOST_STATUS_TITLES[HOST_STATUS_UNDER_MAINTENANCE],
        maintenance,
        host,
      };
    }
    return {
      status: HOST_STATUS_STARTING_MAINTENANCE,
      title: HOST_STATUS_TITLES[HOST_STATUS_STARTING_MAINTENANCE],
      maintenance,
      host,
    };
  }
  return null;
};
