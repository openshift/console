import * as _ from 'lodash';
import { K8sResourceKind, modelFor } from '@console/internal/module/k8s';
import { getRouteWebURL } from '@console/internal/components/routes';
import {
  TransformResourceData,
  OverviewItem,
  isKnativeServing,
  deploymentKindMap,
} from '@console/shared';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import {
  edgesFromAnnotations,
  createResourceConnection,
  updateResourceApplication,
  removeResourceConnection,
} from '../../utils/application-utils';
import {
  TopologyDataModel,
  TopologyDataResources,
  TopologyDataObject,
  Node,
  Edge,
  Group,
} from './topology-types';

export const getCheURL = (consoleLinks: K8sResourceKind[]) =>
  _.get(_.find(consoleLinks, ['metadata.name', 'che']), 'spec.href', '');

export const getEditURL = (gitURL: string, cheURL: string) => {
  return gitURL && cheURL ? `${cheURL}/f?url=${gitURL}&policies.create=peruser` : gitURL;
};

/**
 * filter data based on the active application
 * @param data
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
const getRouteData = (ksroute: K8sResourceKind[]): string => {
  return ksroute && ksroute.length > 0 && !_.isEmpty(ksroute[0].status)
    ? ksroute[0].status.url
    : null;
};

/**
 * get routes url
 */
const getRoutesUrl = (routes: K8sResourceKind[], ksroute?: K8sResourceKind[]): string => {
  if (routes.length > 0 && !_.isEmpty(routes[0].spec)) {
    return getRouteWebURL(routes[0]);
  }
  return getRouteData(ksroute);
};

/**
 * create instance of TransformResourceData, return object containing all methods
 * @param resources
 * @param utils
 */
const createInstanceForResource = (resources: TopologyDataResources, utils?: Function[]) => {
  const transformResourceData = new TransformResourceData(resources, utils);

  return {
    deployments: transformResourceData.createDeploymentItems,
    deploymentConfigs: transformResourceData.createDeploymentConfigItems,
    daemonSets: transformResourceData.createDaemonSetItems,
    statefulSets: transformResourceData.createStatefulSetItems,
  };
};

/**
 * create all data that need to be shown on a topology data
 * @param dc resource item
 * @param cheURL che link
 */
const createTopologyNodeData = (dc: OverviewItem, cheURL?: string): TopologyDataObject => {
  const { obj: deploymentConfig, current, previous, isRollingOut } = dc;
  const dcUID = _.get(deploymentConfig, 'metadata.uid');
  const deploymentsLabels = _.get(deploymentConfig, 'metadata.labels', {});
  const deploymentsAnnotations = _.get(deploymentConfig, 'metadata.annotations', {});
  const { buildConfigs } = dc;
  return {
    id: dcUID,
    name:
      _.get(deploymentConfig, 'metadata.name') || deploymentsLabels['app.kubernetes.io/instance'],
    type: 'workload',
    resources: { ...dc },
    pods: dc.pods,
    data: {
      url: getRoutesUrl(dc.routes, _.get(dc, ['ksroutes'])),
      kind: deploymentConfig.kind,
      editUrl:
        deploymentsAnnotations['app.openshift.io/edit-url'] ||
        getEditURL(deploymentsAnnotations['app.openshift.io/vcs-uri'], cheURL),
      builderImage:
        getImageForIconClass(`icon-${deploymentsLabels['app.openshift.io/runtime']}`) ||
        getImageForIconClass(`icon-${deploymentsLabels['app.kubernetes.io/name']}`) ||
        getImageForIconClass(`icon-openshift`),
      isKnativeResource: isKnativeServing(deploymentConfig, 'metadata.labels'),
      build: _.get(buildConfigs[0], 'builds[0]'),
      donutStatus: {
        pods: dc.pods,
        current,
        previous,
        isRollingOut,
        dc: deploymentConfig,
      },
    },
  };
};

/**
 * create node data for graphs
 * @param dc resource
 */
const getTopologyNodeItem = (dc: K8sResourceKind): Node => {
  const uid = _.get(dc, ['metadata', 'uid']);
  const name = _.get(dc, ['metadata', 'name']);
  const label = _.get(dc, ['metadata', 'labels', 'app.openshift.io/instance']);
  return {
    id: uid,
    type: 'workload',
    name: label || name,
  };
};

/**
 * create edge data for graph
 * @param dc
 * @param resources
 */
const getTopologyEdgeItems = (dc: K8sResourceKind, resources: K8sResourceKind[]): Edge[] => {
  const annotations = _.get(dc, 'metadata.annotations');
  const edges = [];
  _.forEach(edgesFromAnnotations(annotations), (edge) => {
    // handles multiple edges
    const targetNode = _.get(
      _.find(resources, (deployment) => {
        const name =
          _.get(deployment, ['metadata', 'labels', 'app.kubernetes.io/instance']) ||
          deployment.metadata.name;
        return name === edge;
      }),
      ['metadata', 'uid'],
    );
    const uid = _.get(dc, ['metadata', 'uid']);
    if (targetNode) {
      edges.push({
        id: `${uid}_${targetNode}`,
        type: 'connects-to',
        source: uid,
        target: targetNode,
      });
    }
  });
  return edges;
};

/**
 * create groups data for graph
 * @param dc
 * @param groups
 */
const getTopologyGroupItems = (dc: K8sResourceKind, groups: Group[]): Group[] => {
  const labels = _.get(dc, ['metadata', 'labels']);
  const uid = _.get(dc, ['metadata', 'uid']);
  _.forEach(labels, (label, key) => {
    if (key !== 'app.kubernetes.io/part-of') {
      return;
    }
    // find and add the groups
    const groupExists = _.some(groups, {
      name: label,
    });
    if (!groupExists) {
      groups.push({
        id: `group:${label}`,
        name: label,
        nodes: [uid],
      });
    } else {
      const gIndex = _.findIndex(groups, { name: label });
      groups[gIndex].nodes.push(uid);
    }
  });
  return groups;
};

/**
 * Tranforms the k8s resources objects into topology data
 * @param resources K8s resources
 * @param transformBy contains all keys for resources that are allowed on topology
 * @param application application name to filter groups
 * @param cheURL che link
 * @param utils
 */
export const transformTopologyData = (
  resources: TopologyDataResources,
  transformBy: string[],
  application?: string,
  cheURL?: string,
  utils?: Function[],
): TopologyDataModel => {
  let topologyGraphAndNodeData: TopologyDataModel = {
    graph: { nodes: [], edges: [], groups: [] },
    topology: {},
  };
  const transformResourceData = createInstanceForResource(resources, utils);
  const allResources = _.cloneDeep(
    _.concat(
      resources.deploymentConfigs && resources.deploymentConfigs.data,
      resources.deployments && resources.deployments.data,
      resources.statefulSets && resources.statefulSets.data,
      resources.daemonSets && resources.daemonSets.data,
    ),
  );

  _.forEach(transformBy, (key) => {
    if (!deploymentKindMap[key]) {
      throw new Error(`Invalid target deployment resource: (${key})`);
    }
    if (!_.isEmpty(resources[key].data)) {
      // filter data based on the active application
      const resourceData = filterBasedOnActiveApplication(resources[key].data, application);
      let nodesData = [];
      let edgesData = [];
      let groupsData = [];
      const dataToShowOnNodes = {};

      transformResourceData[key](resourceData).forEach((item) => {
        const { obj: deploymentConfig } = item;
        const uid = _.get(deploymentConfig, ['metadata', 'uid']);
        dataToShowOnNodes[uid] = createTopologyNodeData(item, cheURL);
        if (!_.some(topologyGraphAndNodeData.graph.nodes, { id: uid })) {
          nodesData = [...nodesData, getTopologyNodeItem(deploymentConfig)];
          edgesData = [...edgesData, ...getTopologyEdgeItems(deploymentConfig, allResources)];
          groupsData = [
            ...getTopologyGroupItems(deploymentConfig, topologyGraphAndNodeData.graph.groups),
          ];
        }
      });
      const {
        graph: { nodes, edges },
        topology,
      } = topologyGraphAndNodeData;
      topologyGraphAndNodeData = {
        graph: {
          nodes: [...nodes, ...nodesData],
          edges: [...edges, ...edgesData],
          groups: [...groupsData],
        },
        topology: { ...topology, ...dataToShowOnNodes },
      };
    }
  });
  return topologyGraphAndNodeData;
};

export const getResourceDeploymentObject = (
  topologyObject: TopologyDataObject,
): K8sResourceKind => {
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

  const resource = getResourceDeploymentObject(item);
  return updateResourceApplication(modelFor(resource.kind), resource, application);
};

export const createTopologyResourceConnection = (
  source: TopologyDataObject,
  target: TopologyDataObject,
  replaceTarget: TopologyDataObject = null,
): Promise<any> => {
  if (!source || !target || source === target) {
    return Promise.reject();
  }

  const sourceObj = getResourceDeploymentObject(source);
  const targetObj = getResourceDeploymentObject(target);
  const replaceTargetObj = replaceTarget && getResourceDeploymentObject(replaceTarget);

  return createResourceConnection(sourceObj, targetObj, replaceTargetObj);
};

export const removeTopologyResourceConnection = (
  source: TopologyDataObject,
  target: TopologyDataObject,
): Promise<any> => {
  if (!source || !target) {
    return Promise.reject();
  }

  const sourceObj = getResourceDeploymentObject(source);
  const targetObj = getResourceDeploymentObject(target);

  return removeResourceConnection(sourceObj, targetObj);
};
