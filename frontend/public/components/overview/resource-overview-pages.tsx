import { Map as ImmutableMap } from 'immutable';

import {
  /* eslint-disable-next-line no-unused-vars */
  GroupVersionKind,
  referenceForModel,
} from '../../module/k8s';
import {
  DaemonSetModel,
  DeploymentModel,
  DeploymentConfigModel,
  StatefulSetModel,
  PodModel,
  VirtualMachineModel,
} from '../../models';

export const resourceOverviewPages = ImmutableMap<GroupVersionKind | string, () => Promise<React.ComponentType<any>>>()
  .set(referenceForModel(DaemonSetModel), () => import('./daemon-set-overview' /* webpackChunkNmae: "daemon-set"*/).then(m => m.DaemonSetOverview))
  .set(referenceForModel(DeploymentModel), () => import('./deployment-overview' /* webpackChunkNmae: "deployment"*/).then(m => m.DeploymentOverviewPage))
  .set(referenceForModel(DeploymentConfigModel), () => import('./deployment-config-overview' /* webpackChunkNmae: "deployment-config"*/).then(m => m.DeploymentConfigOverviewPage))
  .set(referenceForModel(PodModel), () => import('./pod-overview' /* webpackChunkNmae: "pod"*/).then(m => m.PodOverviewPage))
  .set(referenceForModel(StatefulSetModel), () => import('./stateful-set-overview' /* webpackChunkNmae: "stateful-set"*/).then(m => m.StatefulSetOverview))
  .set(referenceForModel(VirtualMachineModel), () => import('../../kubevirt/components/overview/vm-overview' /* webpackChunkNmae: "stateful-set"*/).then(m => m.VirtualMachineOverviewPage));
