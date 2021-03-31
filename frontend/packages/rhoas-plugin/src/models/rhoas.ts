import { K8sKind } from '@console/internal/module/k8s';
import { API_GROUP, API_VERSION } from '../const';

export const CloudServicesRequestModel: K8sKind = {
  apiGroup: API_GROUP,
  apiVersion: API_VERSION,
  kind: 'CloudServicesRequest',
  id: 'cloudservicesrequest',
  plural: 'cloudservicesrequests',
  label: 'Cloud Services Request',
  labelPlural: 'Cloud Services Requests',
  abbr: 'CSCR',
  namespaced: true,
  crd: true,
};

export const KafkaConnectionModel: K8sKind = {
  apiGroup: API_GROUP,
  apiVersion: API_VERSION,
  kind: 'KafkaConnection',
  id: 'kafkaconnection',
  plural: 'kafkaconnections',
  label: 'Kafka Connection',
  labelPlural: 'Kafka Connections',
  abbr: 'AKC',
  namespaced: true,
  crd: true,
};

export const CloudServiceAccountRequest: K8sKind = {
  apiGroup: API_GROUP,
  apiVersion: API_VERSION,
  kind: 'CloudServiceAccountRequest',
  id: 'cloudserviceaccountrequest',
  plural: 'cloudserviceaccountrequests',
  label: 'Cloud service Account Request',
  labelPlural: 'Cloud Service Account Requests',
  abbr: 'CSAR',
  namespaced: true,
  crd: true,
};
