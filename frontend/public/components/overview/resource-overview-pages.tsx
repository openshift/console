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
  .set(referenceForModel(DaemonSetModel), () => import('./daemon-set-overview' /* webpackChunkName: "daemon-set" */).then(m => m.DaemonSetOverview))
  .set(referenceForModel(DeploymentModel), () => import('./deployment-overview' /* webpackChunkName: "deployment" */).then(m => m.DeploymentOverviewPage))
  .set(referenceForModel(DeploymentConfigModel), () => import('./deployment-config-overview' /* webpackChunkName: "deployment-config" */).then(m => m.DeploymentConfigOverviewPage))
  .set(referenceForModel(StatefulSetModel), () => import('./stateful-set-overview' /* webpackChunkName: "stateful-set" */).then(m => m.StatefulSetOverview))
  .set(referenceForModel(PodModel), () => import('./pod-overview' /* webpackChunkNmae: "pod"*/).then(m => m.PodOverviewPage))
  .set(referenceForModel(VirtualMachineModel), () => import('../../extend/kubevirt/components/vm-overview' /* webpackChunkName: "virtual-machine" */).then(m => m.VirtualMachineOverviewPage));
