import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { KNATIVE_SERVING_LABEL } from '../const';

type KnativeItem = {
  revisions?: K8sResourceKind[];
  configurations?: K8sResourceKind[];
  ksroutes?: K8sResourceKind[];
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

export const getKnativeServingRevisions = (dc: K8sResourceKind, props): KnativeItem => {
  const revisions = getRevisions(dc, props);
  return {
    revisions,
  };
};

export const getKnativeServingConfigurations = (dc: K8sResourceKind, props): KnativeItem => {
  const configurations = getConfigurations(dc, props);
  return {
    configurations,
  };
};

export const getKnativeServingRoutes = (dc: K8sResourceKind, props): KnativeItem => {
  const ksroutes = getKSRoute(dc, props);
  return {
    ksroutes,
  };
};
