import * as _ from 'lodash';
import { K8sResourceKind, PodKind, referenceForModel } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { KNATIVE_SERVING_LABEL } from '../const';
import {
  ServiceModel,
  RevisionModel,
  ConfigurationModel,
  RouteModel,
  EventSourceCronJobModel,
  EventSourceContainerModel,
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventSourceKafkaModel,
  EventSourceSinkBindingModel,
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
  eventSourceServicebinding?: K8sResourceKind[];
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

const getEventSourceResource = (
  dc: K8sResourceKind,
  { data }: K8sResourceKind,
): K8sResourceKind[] => {
  const ownerUid = _.get(dc, ['metadata', 'ownerReferences', '0', 'uid'], null);
  const eventSourceResources = _.filter(data, (config: K8sResourceKind) => {
    return ownerUid === _.get(config, ['metadata', 'uid']);
  });
  return eventSourceResources;
};

export const getEventSourceCronjob = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const eventSourceCronjob =
    props && props.eventSourceCronjob && getEventSourceResource(dc, props.eventSourceCronjob);
  return eventSourceCronjob && eventSourceCronjob.length > 0 ? { eventSourceCronjob } : undefined;
};

export const getEventSourceContainer = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const eventSourceContainers =
    props && props.eventSourceContainers && getEventSourceResource(dc, props.eventSourceContainers);
  return eventSourceContainers && eventSourceContainers.length > 0
    ? { eventSourceContainers }
    : undefined;
};

export const getEventSourceApiserver = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const eventSourceApiserver =
    props && props.eventSourceApiserver && getEventSourceResource(dc, props.eventSourceApiserver);
  return eventSourceApiserver && eventSourceApiserver.length > 0
    ? { eventSourceApiserver }
    : undefined;
};

export const getEventSourceCamel = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const eventSourceCamel =
    props && props.eventSourceCamel && getEventSourceResource(dc, props.eventSourceCamel);
  return eventSourceCamel && eventSourceCamel.length > 0 ? { eventSourceCamel } : undefined;
};

export const getEventSourceKafka = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const eventSourceKafka =
    props && props.eventSourceKafka && getEventSourceResource(dc, props.eventSourceKafka);
  return eventSourceKafka && eventSourceKafka.length > 0 ? { eventSourceKafka } : undefined;
};

export const getEventSourceSinkBinding = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const eventSourceServicebinding =
    props &&
    props.eventSourceSinkbinding &&
    getEventSourceResource(dc, props.eventSourceSinkbinding);
  return eventSourceServicebinding && eventSourceServicebinding.length > 0
    ? { eventSourceServicebinding }
    : undefined;
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

export const eventSourceResourcesCronJob = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventSourceCronJobModel),
      namespace,
      prop: 'eventSourceCronjob',
      optional: true,
    },
  ];
  return knativeResource;
};

export const eventSourceResourcesContainer = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventSourceContainerModel),
      namespace,
      prop: 'eventSourceContainers',
      optional: true,
    },
  ];
  return knativeResource;
};

export const eventSourceResourcesApiServer = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventSourceApiServerModel),
      namespace,
      prop: 'eventSourceApiserver',
      optional: true,
    },
  ];
  return knativeResource;
};

export const eventSourceResourcesCamel = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventSourceCamelModel),
      namespace,
      prop: 'eventSourceCamel',
      optional: true,
    },
  ];
  return knativeResource;
};

export const eventSourceResourcesKafka = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventSourceKafkaModel),
      namespace,
      prop: 'eventSourceKafka',
      optional: true,
    },
  ];
  return knativeResource;
};

export const eventSourceResourcesSinkBinding = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(EventSourceSinkBindingModel),
      namespace,
      prop: 'eventSourceSinkbinding',
      optional: true,
    },
  ];
  return knativeResource;
};
