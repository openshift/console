import { K8sKind } from '@console/internal/module/k8s';
import { API_GROUP, API_VERSION } from '../const';

export const CloudServicesRequestModel: K8sKind = {
  apiGroup: API_GROUP,
  apiVersion: API_VERSION,
  kind: 'CloudServicesRequest',
  id: 'cloudservicesrequest',
  plural: 'cloudservicesrequests',
  label: 'Cloud Services Request',
  // t('rhoas-plugin~Cloud Services Request')
  labelKey: 'rhoas-plugin~Cloud Services Request',
  labelPlural: 'Cloud Services Requests',
  // t('rhoas-plugin~Cloud Services Requests')
  labelPluralKey: 'rhoas-plugin~Cloud Services Requests',
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
  // t('rhoas-plugin~Kafka Connection')
  labelKey: 'rhoas-plugin~Kafka Connection',
  labelPlural: 'Kafka Connections',
  // t('rhoas-plugin~Kafka Connections')
  labelPluralKey: 'rhoas-plugin~Kafka Connections',
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
  // t('rhoas-plugin~Cloud service Account Request')
  labelKey: 'rhoas-plugin~Cloud service Account Request',
  labelPlural: 'Cloud Service Account Requests',
  // t('rhoas-plugin~Cloud Service Account Requests')
  labelPluralKey: 'rhoas-plugin~Cloud Service Account Requests',
  abbr: 'CSAR',
  namespaced: true,
  crd: true,
};
