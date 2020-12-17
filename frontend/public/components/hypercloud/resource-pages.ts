import { Map as ImmutableMap } from 'immutable';
import { referenceForModel, GroupVersionKind } from '../../module/k8s';

import { ApprovalModel, ServiceBrokerModel } from '../../models';

type ResourceMapKey = GroupVersionKind | string;
type ResourceMapValue = () => Promise<React.ComponentType<any>>;

export const hyperCloudDetailsPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
  .set(referenceForModel(ApprovalModel), () => import('./approval' /* webpackChunkName: "approval" */).then(m => m.ApprovalsDetailsPage))
  .set(referenceForModel(ServiceBrokerModel), () => import('./service-broker' /* webpackChunkName: "servicebroker" */).then(m => m.ServiceBrokersDetailsPage));

export const hyperCloudListPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
  .set(referenceForModel(ApprovalModel), () => import('./approval' /* webpackChunkName: "approval" */).then(m => m.ApprovalsPage))
  .set(referenceForModel(ServiceBrokerModel), () => import('./service-broker' /* webpackChunkName: "servicebroker" */).then(m => m.ServiceBrokersPage));
