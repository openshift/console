import { K8sKind } from '@console/internal/module/k8s';
import { API_GROUP, API_VERSION } from './../const';

export const ManagedServicesRequestModel: K8sKind = {
  apiGroup: API_GROUP,
  apiVersion: API_VERSION,
  kind: 'ManagedServicesRequest',
  id: 'managedservicesrequest',
  plural: 'managedservicesrequests',
  label: 'Managed Services Request',
  labelPlural: 'Managed Services Requests',
  abbr: 'MSCR',
  namespaced: true,
  crd: true,
};

export const ManagedKafkaConnectionModel: K8sKind = {
  apiGroup: API_GROUP,
  apiVersion: API_VERSION,
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
  apiGroup: API_GROUP,
  apiVersion: API_VERSION,
  kind: 'ManagedServiceAccountRequest',
  id: 'managedserviceaccountrequest',
  plural: 'managedserviceaccountrequests',
  label: 'Managed Service Account Request',
  labelPlural: 'Managed Service Account Requests',
  abbr: 'MSAR',
  namespaced: true,
  crd: true,
};
