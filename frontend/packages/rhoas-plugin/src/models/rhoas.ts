import { K8sKind } from '@console/internal/module/k8s';

export const ManagedKafkaRequestModel: K8sKind = {
  apiGroup: 'rhoas.redhat.com',
  apiVersion: 'v1alpha1',
  kind: 'ManagedKafkaRequest',
  id: 'managedkafkarequest',
  plural: 'managedkafkarequests',
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
  id: 'managedkafkaconnection',
  plural: 'managedkafkaconnections',
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
  id: 'managedserviceaccountrequest',
  plural: 'managedserviceaccountrequests',
  label: 'Managed Service Account Request',
  labelPlural: 'Managed Service Account Requests',
  abbr: 'MSAR',
  namespaced: true,
  crd: true,
};

