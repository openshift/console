import { K8sKind } from '@console/internal/module/k8s';

export const ManagedKafkaRequestModel: K8sKind = {
  apiGroup: 'rhoas.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'ManagedKafkaRequest',
  id: 'ManagedKafkaRequest',
  plural: 'ManagedKafkaRequests',
  label: 'Managed Kafka Request',
  labelPlural: 'Managed Kafka Requests',
  abbr: 'MKR',
  namespaced: true,
  crd: true,
};

export const ManagedKafkaConnectionModel: K8sKind = {
  apiGroup: 'rhoas.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'ManagedKafkaConnection',
  id: 'ManagedKafkaConnection',
  plural: 'ManagedKafkaConnections',
  label: 'Managed Kafka Connection',
  labelPlural: 'Managed Kafka Connections',
  abbr: 'MKC',
  namespaced: true,
  crd: true,
};

export const ManagedServiceAccountRequest: K8sKind = {
  apiGroup: 'rhoas.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'ManagedServiceAccountRequest',
  id: 'ManagedServiceAccountRequest',
  plural: '',
  label: 'Managed Service Account Request',
  labelPlural: 'Managed Service Account Requests',
  abbr: 'MSAR',
  namespaced: true,
  crd: true,
};
