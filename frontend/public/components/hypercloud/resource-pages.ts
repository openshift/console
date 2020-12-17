import { Map as ImmutableMap } from 'immutable';
import { referenceForModel, GroupVersionKind } from '../../module/k8s';

import { ApprovalModel, NamespaceClaimModel, ResourceQuotaClaimModel } from '../../models';

type ResourceMapKey = GroupVersionKind | string;
type ResourceMapValue = () => Promise<React.ComponentType<any>>;

export const hyperCloudDetailsPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
  .set(referenceForModel(ApprovalModel), () => import('./approval' /* webpackChunkName: "approval" */).then(m => m.ApprovalsDetailsPage))
  .set(referenceForModel(ResourceQuotaClaimModel), () => import('./resource-quota-claim' /* webpackChunkName: "resourcequotaclaim" */).then(m => m.ResourceQuotaClaimsDetailsPage))
  .set(referenceForModel(NamespaceClaimModel), () => import('./namespace-claim' /* webpackChunkName: "namespaceclaim" */).then(m => m.NamespaceClaimsDetailsPage));

export const hyperCloudListPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
  .set(referenceForModel(ApprovalModel), () => import('./approval' /* webpackChunkName: "approval" */).then(m => m.ApprovalsPage))
  .set(referenceForModel(ResourceQuotaClaimModel), () => import('./resource-quota-claim' /* webpackChunkName: "resourcequotaclaim" */).then(m => m.ResourceQuotaClaimsPage))
  .set(referenceForModel(NamespaceClaimModel), () => import('./namespace-claim' /* webpackChunkName: "namespaceclaim" */).then(m => m.NamespaceClaimsPage));
