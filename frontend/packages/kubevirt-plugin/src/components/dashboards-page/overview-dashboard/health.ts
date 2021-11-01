import * as _ from 'lodash';
import { PersistentVolumeClaimModel, PodModel } from '@console/internal/models';
import { URLHealthHandler } from '@console/plugin-sdk';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import {
  DataVolumeModel,
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
} from '../../../models';
import { kubevirtReferenceForModel } from '../../../models/kubevirtReferenceForModel';

export const getKubevirtHealthState: URLHealthHandler<KubevirtHealthResponse> = (
  response,
  error,
) => {
  if (error) {
    return { state: HealthState.NOT_AVAILABLE };
  }
  if (!response) {
    return { state: HealthState.LOADING };
  }
  return _.get(response, 'apiserver.connectivity') === 'ok'
    ? { state: HealthState.OK }
    : { state: HealthState.ERROR };
};

type KubevirtHealthResponse = {
  apiserver: {
    connectivity: string;
  };
};

export const additionalResources = {
  vmis: {
    isList: true,
    kind: kubevirtReferenceForModel(VirtualMachineInstanceModel),
  },
  migrations: {
    isList: true,
    kind: kubevirtReferenceForModel(VirtualMachineInstanceMigrationModel),
  },
  dataVolumes: {
    kind: kubevirtReferenceForModel(DataVolumeModel),
    isList: true,
    optional: true,
  },
  pvcs: {
    isList: true,
    kind: PersistentVolumeClaimModel.kind,
    optional: true,
  },
  pods: {
    isList: true,
    kind: PodModel.kind,
  },
};
