import * as _ from 'lodash';
import { K8sResourceKind, PodKind, referenceForModel } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { KNATIVE_SERVING_LABEL } from '../const';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import {
  ServiceModel,
  RevisionModel,
  ConfigurationModel,
  RouteModel,
  EventingSubscriptionModel,
  EventingBrokerModel,
  EventingTriggerModel,
  KafkaModel,
  KafkaTopicModel,
  CamelIntegrationModel,
} from '../models';

export type KnativeItem = {
  revisions?: K8sResourceKind[];
  configurations?: K8sResourceKind[];
  ksroutes?: K8sResourceKind[];
  ksservices?: K8sResourceKind[];
  eventSourceCronjob?: K8sResourceKind[];
  eventSourceContainers?: K8sResourceKind[];
  eventSourceApiserver?: K8sResourceKind[];
  eventSourceCamel?: K8sResourceKind[];
  eventSourceKafka?: K8sResourceKind[];
  eventSourceSinkbinding?: K8sResourceKind[];
  pods?: PodKind[];
};

const isKnativeDeployment = (dc: K8sResourceKind) => {
  return !!_.get(dc.metadata, `labels["${KNATIVE_SERVING_LABEL}"]`);
};

const getKsResource = (dc: K8sResourceKind, { data }: K8sResourceKind): K8sResourceKind[] => {
  let ksResource = [];
  if (isKnativeDeployment(dc)) {
    ksResource = _.filter(data, (config: K8sResourceKind) => {
      return dc.metadata.labels[KNATIVE_SERVING_LABEL] === _.get(config, 'metadata.name');
    });
  }
  return ksResource;
};

const getRevisions = (dc: K8sResourceKind, { data }): K8sResourceKind[] => {
  let revisionResource = [];
  if (isKnativeDeployment(dc)) {
    revisionResource = _.filter(data, (revision: K8sResourceKind) => {
      return dc.metadata.ownerReferences[0].uid === revision.metadata.uid;
    });
  }
  return revisionResource;
};

export const getKnativeServingRevisions = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const revisions = props && props.revisions && getRevisions(dc, props.revisions);
  return revisions && revisions.length > 0 ? { revisions } : undefined;
};

export const getKnativeServingConfigurations = (
  dc: K8sResourceKind,
  props,
): KnativeItem | undefined => {
  const configurations = props && props.configurations && getKsResource(dc, props.configurations);
  return configurations && configurations.length > 0 ? { configurations } : undefined;
};

export const getKnativeServingRoutes = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const ksroutes = props && props.ksroutes && getKsResource(dc, props.ksroutes);
  return ksroutes && ksroutes.length > 0 ? { ksroutes } : undefined;
};

export const getKnativeServingServices = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const ksservices = props && props.ksservices && getKsResource(dc, props.ksservices);
  return ksservices && ksservices.length > 0 ? { ksservices } : undefined;
};

export const knativeServingResourcesRevision = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(RevisionModel),
      namespace,
      prop: 'revisions',
      optional: true,
    },
  ];
  return knativeResource;
};

export const knativeServingResourcesConfigurations = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(ConfigurationModel),
      namespace,
      prop: 'configurations',
      optional: true,
    },
  ];
  return knativeResource;
};

export const knativeServingResourcesRoutes = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(RouteModel),
      namespace,
      prop: 'ksroutes',
      optional: true,
    },
  ];
  return knativeResource;
};

export const knativeServingResourcesServices = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(ServiceModel),
      namespace,
      prop: 'ksservices',
      optional: true,
    },
  ];
  return knativeResource;
};

export const knativeEventingResourcesSubscription = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventingSubscriptionModel),
      namespace,
      prop: 'eventingsubscription',
      optional: true,
    },
  ];
  return knativeResource;
};

export const knativeEventingResourcesBroker = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventingBrokerModel),
      namespace,
      prop: EventingBrokerModel.plural,
      optional: true,
    },
  ];
  return knativeResource;
};

const EVENT_SOURCE_PROVIDER_CSV = 'console.openshift.io/event-source-provider';

export const clusterServiceVersionResource = (namespace: string): FirehoseResource => {
  return {
    isList: true,
    kind: referenceForModel(ClusterServiceVersionModel),
    namespace,
    prop: ClusterServiceVersionModel.plural,
    selector: {
      matchLabels: {
        [EVENT_SOURCE_PROVIDER_CSV]: 'true',
      },
    },
    optional: true,
  };
};

export const knativeServingResourcesRevisionWatchers = (
  namespace: string,
): WatchK8sResources<any> => {
  const knativeResource = {
    revisions: {
      isList: true,
      kind: referenceForModel(RevisionModel),
      namespace,
      optional: true,
    },
  };
  return knativeResource;
};

export const knativeServingResourcesConfigurationsWatchers = (
  namespace: string,
): WatchK8sResources<any> => {
  const knativeResource = {
    configurations: {
      isList: true,
      kind: referenceForModel(ConfigurationModel),
      namespace,
      optional: true,
    },
  };
  return knativeResource;
};

export const knativeServingResourcesRoutesWatchers = (
  namespace: string,
): WatchK8sResources<any> => {
  const knativeResource = {
    ksroutes: {
      isList: true,
      kind: referenceForModel(RouteModel),
      namespace,
      optional: true,
    },
  };
  return knativeResource;
};

export const knativeServingResourcesServicesWatchers = (
  namespace: string,
): WatchK8sResources<any> => {
  const knativeResource = {
    ksservices: {
      isList: true,
      kind: referenceForModel(ServiceModel),
      namespace,
      optional: true,
    },
  };
  return knativeResource;
};

export const knativeEventingResourcesSubscriptionWatchers = (
  namespace: string,
): WatchK8sResources<any> => {
  const knativeResource = {
    eventingsubscription: {
      isList: true,
      kind: referenceForModel(EventingSubscriptionModel),
      namespace,
      optional: true,
    },
  };
  return knativeResource;
};

export const knativeEventingBrokerResourceWatchers = (namespace: string) => {
  return {
    [EventingBrokerModel.plural]: {
      isList: true,
      kind: referenceForModel(EventingBrokerModel),
      namespace,
      optional: true,
    },
  };
};

export const knativeEventingTriggerResourceWatchers = (namespace: string) => {
  return {
    [EventingTriggerModel.plural]: {
      isList: true,
      kind: referenceForModel(EventingTriggerModel),
      namespace,
      optional: true,
    },
  };
};

export const knativeCamelIntegrationsResourceWatchers = (
  namespace: string,
): WatchK8sResources<any> => {
  return {
    [CamelIntegrationModel.plural]: {
      isList: true,
      kind: referenceForModel(CamelIntegrationModel),
      namespace,
      optional: true,
    },
  };
};

export const strimziResourcesWatcher = (): WatchK8sResources<any> => {
  const strimziResources = {
    [KafkaModel.plural]: {
      isList: true,
      kind: referenceForModel(KafkaModel),
      optional: true,
    },
    [KafkaTopicModel.plural]: {
      isList: true,
      kind: referenceForModel(KafkaTopicModel),
      optional: true,
    },
  };
  return strimziResources;
};
