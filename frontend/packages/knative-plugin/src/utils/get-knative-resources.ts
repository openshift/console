import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { KNATIVE_SERVING_LABEL } from '../const';

type KnativeItem = {
  ksroutes: K8sResourceKind[];
  configurations: K8sResourceKind[];
  revisions: K8sResourceKind[];
};

const isKnativeDeployment = (dc: K8sResourceKind) => {
  return !!_.get(dc.metadata, `labels["${KNATIVE_SERVING_LABEL}"]`);
};

const getKSRoute = (dc: K8sResourceKind, { ksroutes }): K8sResourceKind[] => {
  let routeResource = [];
  if (isKnativeDeployment(dc)) {
    routeResource = _.filter(ksroutes.data, (routeConfig: K8sResourceKind) => {
      return dc.metadata.labels[KNATIVE_SERVING_LABEL] === _.get(routeConfig, 'metadata.name');
    });
  }
  return routeResource;
};

const getConfigurations = (dc: K8sResourceKind, { configurations }): K8sResourceKind[] => {
  let configurationResource = [];
  if (isKnativeDeployment(dc)) {
    configurationResource = _.filter(configurations.data, (config: K8sResourceKind) => {
      return dc.metadata.labels[KNATIVE_SERVING_LABEL] === _.get(config, 'metadata.name');
    });
  }
  return configurationResource;
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

export const getKnativeServingResources = (dc: K8sResourceKind, props): KnativeItem => {
  const ksroutes = getKSRoute(dc, props);
  const configurations = getConfigurations(dc, props);
  const revisions = getRevisions(dc, props);
  return {
    ksroutes,
    configurations,
    revisions,
  };
};
