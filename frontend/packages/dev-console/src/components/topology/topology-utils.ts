import * as _ from 'lodash';
import { K8sResourceKind, modelFor, referenceFor } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { getRouteWebURL } from '@console/internal/components/routes';
import { OverviewItem } from '@console/shared';
import { Edge } from '@patternfly/react-topology';
import {
  createResourceConnection,
  updateResourceApplication,
  removeResourceConnection,
} from '../../utils/application-utils';
import { TopologyDataObject } from './topology-types';
import { TYPE_OPERATOR_BACKED_SERVICE } from './operators/components/const';
import { HelmReleaseResourcesMap } from '../helm/helm-types';
import { ALLOW_SERVICE_BINDING } from '../../const';

export const WORKLOAD_TYPES = [
  'deployments',
  'deploymentConfigs',
  'daemonSets',
  'statefulSets',
  'jobs',
  'cronJobs',
  'pods',
];

export const getServiceBindingStatus = ({ FLAGS }: RootState): boolean =>
  FLAGS.get(ALLOW_SERVICE_BINDING);

export const getCheURL = (consoleLinks: K8sResourceKind[]) =>
  _.get(_.find(consoleLinks, ['metadata.name', 'che']), 'spec.href', '');

export const getEditURL = (gitURL: string, cheURL: string) => {
  return gitURL && cheURL ? `${cheURL}/f?url=${gitURL}&policies.create=peruser` : gitURL;
};

export const getHelmReleaseKey = (resource) => `${resource.kind}---${resource.metadata.name}`;

export const isHelmReleaseNode = (
  obj: K8sResourceKind,
  helmResourcesMap: HelmReleaseResourcesMap,
): boolean => {
  if (helmResourcesMap) {
    return helmResourcesMap.hasOwnProperty(getHelmReleaseKey(obj));
  }
  return false;
};

export const getKialiLink = (consoleLinks: K8sResourceKind[], namespace: string): string => {
  const kialiLink = _.find(consoleLinks, ['metadata.name', `kiali-namespace-${namespace}`])?.spec
    ?.href;
  return kialiLink || '';
};

/**
 * filter data based on the active application
 */
export const filterBasedOnActiveApplication = (
  data: K8sResourceKind[],
  application: string,
): K8sResourceKind[] => {
  const PART_OF = 'app.kubernetes.io/part-of';
  if (!application) {
    return data;
  }
  return data.filter((dc) => {
    return _.get(dc, ['metadata', 'labels', PART_OF]) === application;
  });
};

/**
 * get the route data
 */
const getRouteData = (ksroutes: K8sResourceKind[], resource: OverviewItem): string => {
  if (ksroutes && ksroutes.length > 0 && !_.isEmpty(ksroutes[0].status)) {
    const trafficData = _.find(ksroutes[0].status.traffic, {
      revisionName: resource.obj.metadata.name,
    });
    return _.get(trafficData, 'url', ksroutes[0].status.url);
  }
  return null;
};

/**
 * get routes url
 */
export const getRoutesURL = (resource: OverviewItem): string => {
  const { routes, ksroutes } = resource;
  if (routes.length > 0 && !_.isEmpty(routes[0].spec)) {
    return getRouteWebURL(routes[0]);
  }
  return getRouteData(ksroutes, resource);
};

export const getTopologyResourceObject = (topologyObject: TopologyDataObject): K8sResourceKind => {
  if (!topologyObject) {
    return null;
  }
  return _.get(topologyObject, ['resources', 'obj']);
};

export const updateTopologyResourceApplication = (
  item: TopologyDataObject,
  application: string,
): Promise<any> => {
  if (!item || !_.size(item.resources)) {
    return Promise.reject();
  }

  const resources: K8sResourceKind[] = [];
  const updates: Promise<any>[] = [];

  resources.push(getTopologyResourceObject(item));

  if (item.type === TYPE_OPERATOR_BACKED_SERVICE) {
    _.forEach(item.groupResources, (groupResource) => {
      resources.push(getTopologyResourceObject(groupResource));
    });
  }

  for (const resource of resources) {
    const resourceKind = modelFor(referenceFor(resource));
    if (!resourceKind) {
      return Promise.reject(
        new Error(`Unable to update application, invalid resource type: ${resource.kind}`),
      );
    }
    updates.push(updateResourceApplication(resourceKind, resource, application));
  }

  return Promise.all(updates);
};

export const createTopologyResourceConnection = (
  source: TopologyDataObject,
  target: TopologyDataObject,
  replaceTarget: TopologyDataObject = null,
): Promise<K8sResourceKind[] | K8sResourceKind> => {
  if (!source || !target || source === target) {
    return Promise.reject(new Error('Can not create a connection from a node to itself.'));
  }

  const sourceObj = getTopologyResourceObject(source);
  const targetObj = getTopologyResourceObject(target);
  const replaceTargetObj = replaceTarget && getTopologyResourceObject(replaceTarget);

  return createResourceConnection(sourceObj, targetObj, replaceTargetObj);
};

export const removeTopologyResourceConnection = (edge: Edge): Promise<any> => {
  const source = edge.getSource().getData();
  const target = edge.getTarget().getData();

  if (!source || !target) {
    return Promise.reject();
  }

  const sourceObj = getTopologyResourceObject(source);
  const targetObj = getTopologyResourceObject(target);

  return removeResourceConnection(sourceObj, targetObj);
};
