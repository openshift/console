import * as _ from 'lodash';
import { FirehoseResource } from '@console/internal/components/utils';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, PodKind, referenceForModel } from '@console/internal/module/k8s';
import { KafkaConnectionModel } from '@console/rhoas-plugin/src/models';
import { KNATIVE_SERVING_LABEL } from '../const';
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
  CamelKameletBindingModel,
  DomainMappingModel,
} from '../models';
import { Traffic } from '../types';
import {
  getDynamicEventSourcesWatchers,
  getDynamicEventingChannelWatchers,
} from './fetch-dynamic-eventsources-utils';

export type KnativeItem = {
  revisions?: K8sResourceKind[];
  configurations?: K8sResourceKind[];
  ksroutes?: K8sResourceKind[];
  ksservices?: K8sResourceKind[];
  eventSources?: K8sResourceKind[];
  eventingsubscription?: K8sResourceKind[];
  eventSourceCronjob?: K8sResourceKind[];
  eventSourceContainers?: K8sResourceKind[];
  eventSourceApiserver?: K8sResourceKind[];
  eventSourceCamel?: K8sResourceKind[];
  eventSourceKafka?: K8sResourceKind[];
  eventSourceSinkbinding?: K8sResourceKind[];
  domainMappings?: K8sResourceKind[];
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

export const getDomainMapping = (res: K8sResourceKind, { data }): K8sResourceKind[] => {
  const { apiVersion, kind, metadata } = res;
  let domainMappingResource = [];
  if (!metadata || !data.length) return domainMappingResource;
  if (
    kind === ServiceModel.kind &&
    apiVersion === `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`
  ) {
    domainMappingResource = data.filter((domainMapping) => {
      return (
        domainMapping.spec.ref.apiVersion === apiVersion &&
        domainMapping.spec.ref.kind === kind &&
        domainMapping.spec.ref.name === metadata.name
      );
    });
  }
  return domainMappingResource;
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

export const getKnativeServingDomainMapping = (res: K8sResourceKind, props) => {
  const domainMappings =
    props && props.domainmappings && getDomainMapping(res, props.domainmappings);
  return domainMappings?.length > 0 ? { domainMappings } : undefined;
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

export const knativeServingResourcesServices = (
  namespace: string,
  limit?: number,
): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(ServiceModel),
      namespace,
      prop: 'ksservices',
      optional: true,
      ...(limit && { limit }),
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

export const knativeEventingResourcesBroker = (
  namespace: string,
  limit?: number,
): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventingBrokerModel),
      namespace,
      prop: EventingBrokerModel.plural,
      optional: true,
      ...(limit && { limit }),
    },
  ];
  return knativeResource;
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

export const strimziResourcesWatcher = (namespace: string): WatchK8sResources<any> => {
  const strimziResources = {
    [KafkaModel.plural]: {
      isList: true,
      kind: referenceForModel(KafkaModel),
      optional: true,
    },
    [KafkaConnectionModel.plural]: {
      isList: true,
      kind: referenceForModel(KafkaConnectionModel),
      namespace,
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

export const knativeCamelKameletBindingResourceWatchers = (
  namespace: string,
): WatchK8sResources<any> => {
  return {
    [CamelKameletBindingModel.plural]: {
      isList: true,
      kind: referenceForModel(CamelKameletBindingModel),
      namespace,
      optional: true,
    },
  };
};

export const knativeCamelDomainMappingResourceWatchers = (
  namespace: string,
): WatchK8sResources<{ [key: string]: K8sResourceKind[] }> => {
  return {
    [DomainMappingModel.plural]: {
      isList: true,
      kind: referenceForModel(DomainMappingModel),
      namespace,
      optional: true,
    },
  };
};

export const getTrafficByRevision = (revName: string, service: K8sResourceKind) => {
  if (!service.status?.traffic?.length) {
    return {};
  }
  const trafficPercent = service.status.traffic
    .filter((t: Traffic) => t.revisionName === revName)
    .reduce(
      (acc, tr: Traffic) => {
        acc.percent += tr.percent ? tr.percent : 0;
        if (tr.url) {
          acc.urls.push(tr.url);
        }
        return acc;
      },
      { urls: [], percent: 0 },
    );
  return {
    ...trafficPercent,
    percent: trafficPercent.percent ? `${trafficPercent.percent}%` : null,
  };
};

export const getKnativeResources = (namespace: string) => {
  return {
    ...knativeServingResourcesRevisionWatchers(namespace),
    ...knativeServingResourcesConfigurationsWatchers(namespace),
    ...knativeServingResourcesRoutesWatchers(namespace),
    ...knativeServingResourcesServicesWatchers(namespace),
    ...knativeEventingResourcesSubscriptionWatchers(namespace),
    ...getDynamicEventSourcesWatchers(namespace),
    ...getDynamicEventingChannelWatchers(namespace),
    ...knativeEventingBrokerResourceWatchers(namespace),
    ...knativeEventingTriggerResourceWatchers(namespace),
    ...knativeCamelIntegrationsResourceWatchers(namespace),
    ...knativeCamelKameletBindingResourceWatchers(namespace),
    ...knativeCamelDomainMappingResourceWatchers(namespace),
  };
};
