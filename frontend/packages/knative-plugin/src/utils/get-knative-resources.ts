import * as _ from 'lodash';
import type { WatchK8sResources, WatchK8sResourcesGeneric } from '@console/dynamic-plugin-sdk';
import type { WatchK8sResourceWithProp } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { KNATIVE_SERVING_LABEL } from '../const';
import {
  ServiceModel,
  RevisionModel,
  ConfigurationModel,
  RouteModel,
  KafkaModel,
  KafkaTopicModel,
  DomainMappingModel,
  KafkaSinkModel,
  KafkaConnectionModel,
} from '../models';
import type { Traffic } from '../types';
import { fetchEventSourcesCrd, fetchChannelsCrd } from './fetch-dynamic-eventsources-utils';

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
  associatedDeployment?: K8sResourceKind;
};

const isKnativeDeployment = (dc: K8sResourceKind) => {
  return !!_.get(dc.metadata, `labels["${KNATIVE_SERVING_LABEL}"]`);
};

const getKsResource = (dc: K8sResourceKind, { data }: K8sResourceKind): K8sResourceKind[] => {
  let ksResource = [];
  if (isKnativeDeployment(dc)) {
    const name = dc.metadata.labels?.[KNATIVE_SERVING_LABEL];
    ksResource = _.filter(data, (config: K8sResourceKind) => {
      return name === _.get(config, 'metadata.name');
    });
  }
  return ksResource;
};

const getRevisions = (dc: K8sResourceKind, { data }): K8sResourceKind[] => {
  let revisionResource = [];
  if (isKnativeDeployment(dc)) {
    const ownerUid = dc.metadata.ownerReferences?.[0]?.uid;
    revisionResource = _.filter(data, (revision: K8sResourceKind) => {
      return ownerUid && ownerUid === revision.metadata.uid;
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

export const knativeServingResourcesRevision = (namespace: string): WatchK8sResourceWithProp[] => {
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

export const knativeServingResourcesConfigurations = (
  namespace: string,
): WatchK8sResourceWithProp[] => {
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

export const knativeServingResourcesRoutes = (namespace: string): WatchK8sResourceWithProp[] => {
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

const k8sServices = (namespace: string, limit?: number): WatchK8sResourceWithProp[] => {
  const knativeResource = [
    {
      isList: true,
      kind: 'Service',
      namespace,
      prop: 'services',
      optional: true,
      ...(limit && { limit }),
    },
  ];
  return knativeResource;
};

export const knativeServingResourcesServices = (
  namespace: string,
  limit?: number,
): WatchK8sResourceWithProp[] => {
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

const knativeKafkaSinks = (namespace: string, limit?: number): WatchK8sResourceWithProp[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(KafkaSinkModel),
      namespace,
      prop: 'kafkasinks',
      optional: true,
      ...(limit && { limit }),
    },
  ];
  return knativeResource;
};

export const kafkaBootStrapServerResourcesWatcher = (namespace: string): WatchK8sResources<any> => {
  return {
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
  };
};

export const kafkaTopicsResourcesWatcher = (): WatchK8sResources<any> => {
  return {
    [KafkaTopicModel.plural]: {
      isList: true,
      kind: referenceForModel(KafkaTopicModel),
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
  if (!service?.status?.traffic?.length) {
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

export const getSinkableResources = (namespace: string): WatchK8sResourceWithProp[] => {
  return namespace
    ? [
        ...k8sServices(namespace),
        ...knativeServingResourcesServices(namespace),
        ...knativeKafkaSinks(namespace),
      ]
    : [];
};

export const getKnativeEventingResources = async (): Promise<WatchK8sResourcesGeneric> => {
  // Fetch dynamic event sources and channels at runtime
  const eventSourceModels = await fetchEventSourcesCrd();
  const eventingChannels = await fetchChannelsCrd();

  const dynamicEventSources = eventSourceModels.reduce((acc, model) => {
    const ref = referenceForModel(model);
    acc[ref] = {
      model: { group: model.apiGroup, version: model.apiVersion, kind: model.kind },
      opts: { isList: true, optional: true, namespaced: true },
    };
    return acc;
  }, {});

  const dynamicChannels = eventingChannels.reduce((acc, model) => {
    const ref = referenceForModel(model);
    acc[ref] = {
      model: { group: model.apiGroup, version: model.apiVersion, kind: model.kind },
      opts: { isList: true, optional: true, namespaced: true },
    };
    return acc;
  }, {});

  return {
    eventingsubscription: {
      model: { group: 'messaging.knative.dev', version: 'v1', kind: 'Subscription' },
      opts: { isList: true, optional: true, namespaced: true },
    },
    brokers: {
      model: { group: 'eventing.knative.dev', version: 'v1', kind: 'Broker' },
      opts: { isList: true, optional: true, namespaced: true },
    },
    triggers: {
      model: { group: 'eventing.knative.dev', version: 'v1', kind: 'Trigger' },
      opts: { isList: true, optional: true, namespaced: true },
    },
    ...dynamicEventSources,
    ...dynamicChannels,
  };
};
