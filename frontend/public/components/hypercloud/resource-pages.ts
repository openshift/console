import { Map as ImmutableMap } from 'immutable';
import { referenceForModel, GroupVersionKind } from '../../module/k8s';

import { ApprovalModel, ServiceBrokerModel, ServiceClassModel, ServicePlanModel, ClusterServiceBrokerModel, ClusterServiceClassModel, ClusterServicePlanModel, ServiceInstanceModel, ServiceBindingModel, CatalogServiceClaimModel, TemplateModel, TemplateInstanceModel } from '../../models';

type ResourceMapKey = GroupVersionKind | string;
type ResourceMapValue = () => Promise<React.ComponentType<any>>;

export const hyperCloudDetailsPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
  .set(referenceForModel(ApprovalModel), () => import('./approval' /* webpackChunkName: "approval" */).then(m => m.ApprovalsDetailsPage))
  .set(referenceForModel(ServiceBrokerModel), () => import('./service-broker' /* webpackChunkName: "servicebroker" */).then(m => m.ServiceBrokersDetailsPage))
  .set(referenceForModel(ServiceClassModel), () => import('./service-class' /* webpackChunkName: "serviceclass" */).then(m => m.ServiceClassesDetailsPage))
  .set(referenceForModel(ServicePlanModel), () => import('./service-plan' /* webpackChunkName: "serviceplan" */).then(m => m.ServicePlansDetailsPage))
  .set(referenceForModel(ClusterServiceBrokerModel), () => import('./cluster-service-broker' /* webpackChunkName: "clusterservicebroker" */).then(m => m.ClusterServiceBrokersDetailsPage))
  .set(referenceForModel(ClusterServiceClassModel), () => import('./cluster-service-class' /* webpackChunkName: "clusterserviceclass" */).then(m => m.ClusterServiceClassesDetailsPage))
  .set(referenceForModel(ClusterServicePlanModel), () => import('./cluster-service-plan' /* webpackChunkName: "clusterserviceplan" */).then(m => m.ClusterServicePlansDetailsPage))
  .set(referenceForModel(ServiceInstanceModel), () => import('./service-instance' /* webpackChunkName: "serviceinstance" */).then(m => m.ServiceInstancesDetailsPage))
  .set(referenceForModel(ServiceBindingModel), () => import('./service-binding' /* webpackChunkName: "servicebinding" */).then(m => m.ServiceBindingsDetailsPage))
  .set(referenceForModel(CatalogServiceClaimModel), () => import('./catalog-service-claim' /* webpackChunkName: "catalogserviceclaim" */).then(m => m.CatalogServiceClaimsDetailsPage))
  .set(referenceForModel(TemplateModel), () => import('./template' /* webpackChunkName: "template" */).then(m => m.TemplatesDetailsPage))
  .set(referenceForModel(TemplateInstanceModel), () => import('./template-instance' /* webpackChunkName: "templateinstance" */).then(m => m.TemplateInstancesDetailsPage));

export const hyperCloudListPages = ImmutableMap<ResourceMapKey, ResourceMapValue>()
  .set(referenceForModel(ApprovalModel), () => import('./approval' /* webpackChunkName: "approval" */).then(m => m.ApprovalsPage))
  .set(referenceForModel(ServiceBrokerModel), () => import('./service-broker' /* webpackChunkName: "servicebroker" */).then(m => m.ServiceBrokersPage))
  .set(referenceForModel(ServiceClassModel), () => import('./service-class' /* webpackChunkName: "serviceclass" */).then(m => m.ServiceClassesPage))
  .set(referenceForModel(ServicePlanModel), () => import('./service-plan' /* webpackChunkName: "serviceplan" */).then(m => m.ServicePlansPage))
  .set(referenceForModel(ClusterServiceBrokerModel), () => import('./cluster-service-broker' /* webpackChunkName: "clusterservicebroker" */).then(m => m.ClusterServiceBrokersPage))
  .set(referenceForModel(ClusterServiceClassModel), () => import('./cluster-service-class' /* webpackChunkName: "clusterserviceclass" */).then(m => m.ClusterServiceClassesPage))
  .set(referenceForModel(ClusterServicePlanModel), () => import('./cluster-service-plan' /* webpackChunkName: "clusterserviceplan" */).then(m => m.ClusterServicePlansPage))
  .set(referenceForModel(ServiceInstanceModel), () => import('./service-instance' /* webpackChunkName: "serviceinstance" */).then(m => m.ServiceInstancesPage))
  .set(referenceForModel(ServiceBindingModel), () => import('./service-binding' /* webpackChunkName: "servicebinding" */).then(m => m.ServiceBindingsPage))
  .set(referenceForModel(CatalogServiceClaimModel), () => import('./catalog-service-claim' /* webpackChunkName: "catalogserviceclaim" */).then(m => m.CatalogServiceClaimsPage))
  .set(referenceForModel(TemplateModel), () => import('./template' /* webpackChunkName: "template" */).then(m => m.TemplatesPage))
  .set(referenceForModel(TemplateInstanceModel), () => import('./template-instance' /* webpackChunkName: "templateinstance" */).then(m => m.TemplateInstancesPage));
