import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { SecretModel } from '@console/internal/models';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import {
  TopologyDataModel,
  TopologyDataResources,
  TopologyDataMap,
  Group,
} from '../topology-types';
import { TYPE_HELM_RELEASE, TYPE_HELM_WORKLOAD } from './components/const';
import { HelmReleaseResourcesMap } from '../../helm/helm-types';
import { getHelmReleaseKey } from '../topology-utils';
import {
  dataObjectFromModel,
  addToTopologyDataModel,
  createInstanceForResource,
  createTopologyNodeData,
  getTopologyEdgeItems,
  getTopologyGroupItems,
  getTopologyNodeItem,
  mergeGroup,
  mergeGroups,
} from '../data-transforms/transform-utils';

export const isHelmReleaseNode = (
  obj: K8sResourceKind,
  helmResourcesMap: HelmReleaseResourcesMap,
): boolean => {
  if (helmResourcesMap) {
    return helmResourcesMap.hasOwnProperty(getHelmReleaseKey(obj));
  }
  return false;
};

export const getTopologyHelmReleaseGroupItem = (
  obj: K8sResourceKind,
  helmResourcesMap: HelmReleaseResourcesMap,
  secrets: K8sResourceKind[],
): { groups: Group[]; dataModel: TopologyDataMap } => {
  const resourceKindName = getHelmReleaseKey(obj);
  const helmResources = helmResourcesMap[resourceKindName];
  const releaseName = helmResources?.releaseName;
  const uid = _.get(obj, ['metadata', 'uid'], null);
  const returnData = { groups: [], dataModel: {} };

  if (!releaseName) {
    return returnData;
  }

  const secret = secrets.find((nextSecret) => {
    const { labels } = nextSecret.metadata;
    return labels && labels.name && labels.name.includes(releaseName);
  });

  if (secret) {
    const appGroup = getTopologyGroupItems(secret);
    if (appGroup) {
      mergeGroup(appGroup, returnData.groups);
    }
  }

  const helmGroup = {
    id: secret ? secret.metadata.uid : `${TYPE_HELM_RELEASE}:${releaseName}`,
    type: TYPE_HELM_RELEASE,
    name: releaseName,
    nodes: [uid],
  };

  const dataModel = dataObjectFromModel(helmGroup);
  const { kind, apiVersion } = SecretModel;
  dataModel.resources = {
    obj: secret ? { ...secret, kind, apiVersion } : null,
    buildConfigs: null,
    services: null,
    routes: null,
  };
  dataModel.data = {
    manifestResources: helmResources?.manifestResources || [],
  };
  returnData.dataModel[helmGroup.id] = dataModel;
  returnData.groups.push(helmGroup);

  return returnData;
};

export const getHelmTopologyDataModel = (
  resources: TopologyDataResources,
  allResources: K8sResourceKind[],
  installedOperators,
  utils: Function[],
  transformBy: string[],
  serviceBindingRequests: K8sResourceKind[],
  helmResourcesMap?: HelmReleaseResourcesMap,
): TopologyDataModel => {
  const helmDataModel: TopologyDataModel = {
    graph: { nodes: [], edges: [], groups: [] },
    topology: {},
  };
  const helmResources = {};
  const transformResourceData = createInstanceForResource(resources, utils, installedOperators);

  const secrets = _.get(resources, 'secrets.data', []);
  _.forEach(transformBy, (key) => {
    helmResources[key] = [];
    if (!_.isEmpty(resources[key].data)) {
      const typedDataModel: TopologyDataModel = {
        graph: { nodes: [], edges: [], groups: [] },
        topology: {},
      };

      transformResourceData[key](resources[key].data).forEach((item) => {
        const { obj: deploymentConfig } = item;
        const uid = _.get(deploymentConfig, ['metadata', 'uid']);
        if (isHelmReleaseNode(deploymentConfig, helmResourcesMap)) {
          helmResources[key].push(uid);
          typedDataModel.topology[uid] = createTopologyNodeData(
            item,
            TYPE_HELM_WORKLOAD,
            getImageForIconClass(`icon-openshift`),
          );
          typedDataModel.graph.nodes.push(
            getTopologyNodeItem(deploymentConfig, TYPE_HELM_WORKLOAD),
          );
          typedDataModel.graph.edges.push(
            ...getTopologyEdgeItems(deploymentConfig, allResources, serviceBindingRequests),
          );
          const { groups, dataModel } = getTopologyHelmReleaseGroupItem(
            deploymentConfig,
            helmResourcesMap,
            secrets,
          );
          mergeGroups(groups, typedDataModel.graph.groups);
          typedDataModel.topology = _.merge(typedDataModel.topology, dataModel);
        }
      });
      addToTopologyDataModel(typedDataModel, helmDataModel);
    }
  });

  _.forEach(transformBy, (key) => {
    if (!_.isEmpty(resources[key].data) && !_.isEmpty(helmResources[key])) {
      resources[key].data = resources[key].data.filter(
        (resource) => !helmResources[key].find((uid) => uid === resource.metadata.uid),
      );
    }
  });
  return helmDataModel;
};
