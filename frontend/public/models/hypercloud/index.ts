import { K8sKind } from '../../module/k8s';

// 추가
export const ApprovalModel: K8sKind = {
  label: 'Approval',
  labelPlural: 'Approvals',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'approvals',
  abbr: 'A',
  kind: 'Approval',
  id: 'approval',
  namespaced: true,
};

export const ServiceBrokerModel: K8sKind = {
  label: 'Service Broker',
  labelPlural: 'Service Brokers',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'servicebrokers',
  abbr: 'SB',
  kind: 'ServiceBroker',
  id: 'servicebroker',
  namespaced: true,
};

export const ServiceClassModel: K8sKind = {
  label: 'Service Class',
  labelPlural: 'Service Classes',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'serviceclasses',
  abbr: 'SC',
  kind: 'ServiceClass',
  id: 'serviceclass',
  namespaced: true,
};

export const ServicePlanModel: K8sKind = {
  label: 'Service Plan',
  labelPlural: 'Service Plans',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'serviceplans',
  abbr: 'SP',
  kind: 'ServicePlan',
  id: 'serviceplan',
  namespaced: true,
};

export const ClusterServiceBrokerModel: K8sKind = {
  label: 'Cluster Service Broker',
  labelPlural: 'Cluster Service Brokers',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'clusterservicebrokers',
  abbr: 'CSB',
  kind: 'ClusterServiceBroker',
  id: 'clusterservicebroker',
  namespaced: false,
};

export const ClusterServiceClassModel: K8sKind = {
  label: 'Cluster Service Class',
  labelPlural: 'Cluster Service Classes',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'clusterserviceclasses',
  abbr: 'CSC',
  kind: 'ClusterServiceClass',
  id: 'clusterserviceclass',
  namespaced: false,
};

export const ClusterServicePlanModel: K8sKind = {
  label: 'Cluster Service Plan',
  labelPlural: 'Cluster Service Plans',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'clusterserviceplans',
  abbr: 'CSP',
  kind: 'ClusterServicePlan',
  id: 'clusterserviceplan',
  namespaced: false,
};

export const ServiceInstanceModel: K8sKind = {
  label: 'Service Instance',
  labelPlural: 'Service Instances',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'serviceinstances',
  abbr: 'SI',
  kind: 'ServiceInstance',
  id: 'serviceinstance',
  namespaced: true,
};

export const ServiceBindingModel: K8sKind = {
  label: 'Service Binding',
  labelPlural: 'Service Bindings',
  apiVersion: 'v1beta1',
  apiGroup: 'servicecatalog.k8s.io',
  plural: 'servicebindings',
  abbr: 'SB',
  kind: 'ServiceBinding',
  id: 'servicebinding',
  namespaced: true,
};

export const CatalogServiceClaimModel: K8sKind = {
  label: 'CatalogServiceClaim',
  labelPlural: 'Catalog Service Claim',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'catalogserviceclaims',
  abbr: 'CSC',
  kind: 'CatalogServiceClaim',
  id: 'catalogserviceclaim',
  namespaced: true,
};

export const TemplateModel: K8sKind = {
  label: 'Template',
  labelPlural: 'Templates',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'templates',
  abbr: 'T',
  kind: 'Template',
  id: 'template',
  namespaced: true,
};

export const TemplateInstanceModel: K8sKind = {
  label: 'Template Instance',
  labelPlural: 'Template Instances',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'templateinstances',
  abbr: 'TI',
  kind: 'TemplateInstance',
  id: 'templateinstance',
  namespaced: true,
};
