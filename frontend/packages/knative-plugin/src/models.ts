import { chart_color_cyan_400 as knativeServingColor } from '@patternfly/react-tokens/dist/js/chart_color_cyan_400';
import { chart_color_red_300 as knativeEventingColor } from '@patternfly/react-tokens/dist/js/chart_color_red_300';
import { K8sKind } from '@console/internal/module/k8s';
import {
  KNATIVE_SERVING_APIGROUP,
  KNATIVE_EVENT_MESSAGE_APIGROUP,
  KNATIVE_EVENTING_APIGROUP,
  CAMEL_APIGROUP,
  STRIMZI_KAFKA_APIGROUP,
} from './const';

const apiVersion = 'v1';

export const ConfigurationModel: K8sKind = {
  apiGroup: KNATIVE_SERVING_APIGROUP,
  apiVersion,
  kind: 'Configuration',
  plural: 'configurations',
  label: 'Configuration',
  // t('knative-plugin~Configuration')
  labelKey: 'knative-plugin~Configuration',
  labelPlural: 'Configurations',
  // t('knative-plugin~Configurations')
  labelPluralKey: 'knative-plugin~Configurations',
  id: 'configuration',
  abbr: 'CFG',
  namespaced: true,
  crd: true,
  color: knativeServingColor.value,
};

export const KnativeServingModel: K8sKind = {
  apiGroup: 'operator.knative.dev',
  apiVersion: 'v1alpha1',
  kind: 'KnativeServing',
  label: 'KnativeServing',
  // t('knative-plugin~KnativeServing')
  labelKey: 'knative-plugin~KnativeServing',
  labelPlural: 'KnativeServings',
  // t('knative-plugin~KnativeServings')
  labelPluralKey: 'knative-plugin~KnativeServings',
  plural: 'knativeservings',
  id: 'knativeserving',
  abbr: 'KS',
  namespaced: true,
  crd: true,
  color: knativeServingColor.value,
};

export const RevisionModel: K8sKind = {
  apiGroup: KNATIVE_SERVING_APIGROUP,
  apiVersion,
  kind: 'Revision',
  label: 'Revision',
  // t('knative-plugin~Revision')
  labelKey: 'knative-plugin~Revision',
  // t('knative-plugin~Revisions')
  labelPluralKey: 'knative-plugin~Revisions',
  labelPlural: 'Revisions',
  plural: 'revisions',
  id: 'revision',
  abbr: 'REV',
  namespaced: true,
  crd: true,
  color: knativeServingColor.value,
};

export const RouteModel: K8sKind = {
  apiGroup: KNATIVE_SERVING_APIGROUP,
  apiVersion,
  kind: 'Route',
  label: 'Route',
  // t('knative-plugin~Route')
  labelKey: 'knative-plugin~Route',
  labelPlural: 'Routes',
  // t('knative-plugin~Routes')
  labelPluralKey: 'knative-plugin~Routes',
  plural: 'routes',
  id: 'route',
  abbr: 'RT',
  namespaced: true,
  crd: true,
  color: knativeServingColor.value,
};

export const ServiceModel: K8sKind = {
  apiGroup: KNATIVE_SERVING_APIGROUP,
  apiVersion,
  kind: 'Service',
  label: 'Service',
  // t('knative-plugin~Service')
  labelKey: 'knative-plugin~Service',
  // t('knative-plugin~Services')
  labelPluralKey: 'knative-plugin~Services',
  labelPlural: 'Services',
  plural: 'services',
  id: 'service',
  abbr: 'KSVC',
  namespaced: true,
  crd: true,
  color: knativeServingColor.value,
};

export const DomainMappingModel: K8sKind = {
  apiGroup: KNATIVE_SERVING_APIGROUP,
  apiVersion: 'v1alpha1',
  kind: 'DomainMapping',
  label: 'DomainMapping',
  // t('knative-plugin~DomainMapping')
  labelKey: 'knative-plugin~DomainMapping',
  labelPlural: 'DomainMappings',
  // t('knative-plugin~DomainMappings')
  labelPluralKey: 'knative-plugin~DomainMappings',
  plural: 'domainmappings',
  id: 'DomainMapping',
  abbr: 'DM',
  namespaced: true,
  crd: true,
  color: knativeServingColor.value,
};

export const EventingSubscriptionModel: K8sKind = {
  apiGroup: KNATIVE_EVENT_MESSAGE_APIGROUP,
  apiVersion,
  kind: 'Subscription',
  label: 'Subscription',
  // t('knative-plugin~Subscription')
  labelKey: 'knative-plugin~Subscription',
  labelPlural: 'Subscriptions',
  // t('knative-plugin~Subscriptions')
  labelPluralKey: 'knative-plugin~Subscriptions',
  plural: 'subscriptions',
  id: 'subscriptioneventing',
  abbr: 'S',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const EventingBrokerModel: K8sKind = {
  apiGroup: KNATIVE_EVENTING_APIGROUP,
  apiVersion,
  kind: 'Broker',
  label: 'Broker',
  // t('knative-plugin~Broker')
  labelKey: 'knative-plugin~Broker',
  labelPlural: 'Brokers',
  // t('knative-plugin~Brokers')
  labelPluralKey: 'knative-plugin~Brokers',
  plural: 'brokers',
  id: 'broker',
  abbr: 'B',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const EventingTriggerModel: K8sKind = {
  apiGroup: KNATIVE_EVENTING_APIGROUP,
  apiVersion,
  kind: 'Trigger',
  label: 'Trigger',
  // t('knative-plugin~Trigger')
  labelKey: 'knative-plugin~Trigger',
  labelPlural: 'Triggers',
  // t('knative-plugin~Triggers')
  labelPluralKey: 'knative-plugin~Triggers',
  plural: 'triggers',
  id: 'trigger',
  abbr: 'T',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const CamelIntegrationModel: K8sKind = {
  apiGroup: CAMEL_APIGROUP,
  apiVersion,
  kind: 'Integration',
  label: 'Integration',
  // t('knative-plugin~Integration')
  labelKey: 'knative-plugin~Integration',
  labelPlural: 'Integrations',
  // t('knative-plugin~Integration')
  labelPluralKey: 'knative-plugin~Integrations',
  plural: 'integrations',
  id: 'integration',
  abbr: 'I',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const KafkaModel: K8sKind = {
  apiGroup: STRIMZI_KAFKA_APIGROUP,
  apiVersion: 'v1beta2',
  kind: 'Kafka',
  label: 'Kafka',
  // t('knative-plugin~Kafka')
  labelKey: 'knative-plugin~Kafka',
  labelPlural: 'Kafkas',
  // t('knative-plugin~Kafkas')
  labelPluralKey: 'knative-plugin~Kafkas',
  plural: 'kafkas',
  id: 'kafka',
  abbr: 'K',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const KafkaTopicModel: K8sKind = {
  apiGroup: STRIMZI_KAFKA_APIGROUP,
  apiVersion: 'v1beta2',
  kind: 'KafkaTopic',
  label: 'KafkaTopic',
  // t('knative-plugin~KafkaTopic')
  labelKey: 'knative-plugin~KafkaTopic',
  labelPlural: 'KafkaTopics',
  // t('knative-plugin~KafkaTopics')
  labelPluralKey: 'knative-plugin~KafkaTopics',
  plural: 'kafkatopics',
  id: 'kafkatopic',
  abbr: 'KT',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const CamelKameletBindingModel: K8sKind = {
  apiGroup: CAMEL_APIGROUP,
  apiVersion: 'v1alpha1',
  kind: 'KameletBinding',
  label: 'KameletBinding',
  // t('knative-plugin~KameletBinding')
  labelKey: 'knative-plugin~KameletBinding',
  labelPlural: 'KameletBindings',
  // t('knative-plugin~KameletBindings')
  labelPluralKey: 'knative-plugin~KameletBindings',
  plural: 'kameletbindings',
  id: 'kameletbinding',
  abbr: 'KB',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const CamelKameletModel: K8sKind = {
  apiGroup: CAMEL_APIGROUP,
  apiVersion: 'v1alpha1',
  kind: 'Kamelet',
  label: 'Kamelet',
  // t('knative-plugin~Kamelet')
  labelKey: 'knative-plugin~Kamelet',
  labelPlural: 'Kamelets',
  // t('knative-plugin~Kamelets')
  labelPluralKey: 'knative-plugin~Kamelets',
  plural: 'kamelets',
  id: 'kamelet',
  abbr: 'K',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};
