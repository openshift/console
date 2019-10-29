import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { KNATIVE_SERVING_LABEL } from '../const';

export type KnativeItem = {
  revisions?: K8sResourceKind[];
  configurations?: K8sResourceKind[];
  ksroutes?: K8sResourceKind[];
  ksservices?: K8sResourceKind[];
  eventSourceCronjob?: K8sResourceKind[];
  eventSourceContainers?: K8sResourceKind[];
};

const isKnativeDeployment = (dc: K8sResourceKind) => {
  return !!_.get(dc.metadata, `labels["${KNATIVE_SERVING_LABEL}"]`);
};

const getKsResource = (dc: K8sResourceKind, res: K8sResourceKind): K8sResourceKind[] => {
  let ksResource = [];
  if (isKnativeDeployment(dc)) {
    ksResource = _.filter(res.data, (config: K8sResourceKind) => {
      return dc.metadata.labels[KNATIVE_SERVING_LABEL] === _.get(config, 'metadata.name');
    });
  }
  return ksResource;
};

const getRevisions = (dc: K8sResourceKind, { revisions }): K8sResourceKind[] => {
  let revisionResource = [];
  if (isKnativeDeployment(dc)) {
    revisionResource = _.filter(revisions.data, (revision: K8sResourceKind) => {
      return dc.metadata.ownerReferences[0].uid === revision.metadata.uid;
    });
  }
  return revisionResource;
};

export const getKnativeServingRevisions = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const revisions = getRevisions(dc, props);
  return revisions.length > 0 ? { revisions } : undefined;
};

export const getKnativeServingConfigurations = (
  dc: K8sResourceKind,
  props,
): KnativeItem | undefined => {
  const configurations =
    props && props.configurations ? getKsResource(dc, props.configurations) : undefined;
  return configurations && configurations.length > 0 ? { configurations } : undefined;
};

export const getKnativeServingRoutes = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const ksroutes = props && props.ksroutes ? getKsResource(dc, props.ksroutes) : undefined;
  return ksroutes && ksroutes.length > 0 ? { ksroutes } : undefined;
};

export const getKnativeServingServices = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const ksservices = props && props.ksservices ? getKsResource(dc, props.ksservices) : undefined;
  return ksservices && ksservices.length > 0 ? { ksservices } : undefined;
};

const getEventSourceResource = (
  dc: K8sResourceKind,
  eventSource: K8sResourceKind,
): K8sResourceKind[] => {
  let eventSourceResources = [];
  const ownerUid = _.get(dc, ['metadata', 'ownerReferences', '0', 'uid'], null);
  if (ownerUid) {
    eventSourceResources = _.filter(eventSource.data, (config: K8sResourceKind) => {
      return ownerUid === _.get(config, ['metadata', 'uid']);
    });
  }
  return eventSourceResources;
};

export const getEventSourceCronjob = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const eventSourceCronjob = getEventSourceResource(dc, props.eventSourceCronjob);
  return eventSourceCronjob.length > 0 ? { eventSourceCronjob } : undefined;
};

export const getEventSourceContainer = (dc: K8sResourceKind, props): KnativeItem | undefined => {
  const eventSourceContainers = getEventSourceResource(dc, props.eventSourceContainers);
  return eventSourceContainers.length > 0 ? { eventSourceContainers } : undefined;
};
