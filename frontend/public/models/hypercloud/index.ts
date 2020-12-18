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
