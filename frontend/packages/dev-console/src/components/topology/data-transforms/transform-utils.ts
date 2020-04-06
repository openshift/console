import * as _ from 'lodash';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { TransformResourceData, isKnativeServing } from '@console/shared';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import {
  TYPE_EVENT_SOURCE,
  TYPE_KNATIVE_REVISION,
} from '@console/knative-plugin/src/topology/const';
import { edgesFromAnnotations, edgesFromServiceBinding } from '../../../utils/application-utils';
import {
  TopologyDataModel,
  TopologyDataResources,
  TopologyDataObject,
  Node,
  Edge,
  Group,
  TopologyOverviewItem,
} from '../topology-types';
import {
  TYPE_APPLICATION_GROUP,
  TYPE_WORKLOAD,
  TYPE_CONNECTS_TO,
  TYPE_SERVICE_BINDING,
} from '../components/const';
import { getRoutesURL } from '../topology-utils';

export const dataObjectFromModel = (node: Node | Group): TopologyDataObject => {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    resources: null,
    operatorBackedService: false,
    data: null,
  };
};

/**
 * create instance of TransformResourceData, return object containing all methods
 */
export const createInstanceForResource = (
  resources: TopologyDataResources,
  utils?: Function[],
  installedOperators?: ClusterServiceVersionKind[],
) => {
  const transformResourceData = new TransformResourceData(resources, utils, installedOperators);

  return {
    deployments: transformResourceData.createDeploymentItems,
    deploymentConfigs: transformResourceData.createDeploymentConfigItems,
    daemonSets: transformResourceData.createDaemonSetItems,
    statefulSets: transformResourceData.createStatefulSetItems,
  };
};

/**
 * create all data that need to be shown on a topology data
 */
export const createTopologyNodeData = (
  dc: TopologyOverviewItem,
  type: string,
  defaultIcon: string,
  operatorBackedService: boolean = false,
): TopologyDataObject => {
  const {
    obj: deploymentConfig,
    current,
    previous,
    isRollingOut,
    buildConfigs,
    pipelines = [],
    pipelineRuns = [],
  } = dc;
  const dcUID = _.get(deploymentConfig, 'metadata.uid');
  const deploymentsLabels = _.get(deploymentConfig, 'metadata.labels', {});
  const deploymentsAnnotations = _.get(deploymentConfig, 'metadata.annotations', {});

  const builderImageIcon =
    getImageForIconClass(`icon-${deploymentsLabels['app.openshift.io/runtime']}`) ||
    getImageForIconClass(`icon-${deploymentsLabels['app.kubernetes.io/name']}`);
  return {
    id: dcUID,
    name:
      _.get(deploymentConfig, 'metadata.name') || deploymentsLabels['app.kubernetes.io/instance'],
    type,
    resources: { ...dc, isOperatorBackedService: operatorBackedService },
    pods: dc.pods,
    operatorBackedService,
    data: {
      url: getRoutesURL(dc),
      kind: referenceFor(deploymentConfig),
      editURL: deploymentsAnnotations['app.openshift.io/edit-url'],
      vcsURI: deploymentsAnnotations['app.openshift.io/vcs-uri'],
      builderImage: builderImageIcon || defaultIcon,
      isKnativeResource:
        type && (type === TYPE_EVENT_SOURCE || type === TYPE_KNATIVE_REVISION)
          ? true
          : isKnativeServing(deploymentConfig, 'metadata.labels'),
      build: _.get(buildConfigs[0], 'builds[0]'),
      connectedPipeline: {
        pipeline: pipelines[0],
        pipelineRuns,
      },
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
 */
export const getTopologyNodeItem = (
  dc: K8sResourceKind,
  type?: string,
  children?: string[],
): Node => {
  const uid = _.get(dc, ['metadata', 'uid']);
  const name = _.get(dc, ['metadata', 'name']);
  const label = _.get(dc, ['metadata', 'labels', 'app.openshift.io/instance']);

  return {
    id: uid,
    type: type || TYPE_WORKLOAD,
    name: label || name,
    ...(children && children.length && { children }),
  };
};

/**
 * create edge data for graph
 */
export const getTopologyEdgeItems = (
  dc: K8sResourceKind,
  resources: K8sResourceKind[],
  sbrs: K8sResourceKind[],
): Edge[] => {
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
        type: TYPE_CONNECTS_TO,
        source: uid,
        target: targetNode,
      });
    }
  });

  _.forEach(edgesFromServiceBinding(dc, sbrs), (sbr) => {
    // look for multiple backing services first in `backingServiceSelectors`
    // followed by a fallback to the single reference in `backingServiceSelector`
    _.forEach(sbr.spec.backingServiceSelectors || [sbr.spec.backingServiceSelector], (bss) => {
      // handles multiple edges
      const targetNode = _.get(
        _.find(resources, (deployment) => {
          const name = _.get(deployment, 'metadata.ownerReferences[0].name');
          const kind = _.get(deployment, 'metadata.ownerReferences[0].kind');
          return bss.kind === kind && bss.resourceRef === name;
        }),
        ['metadata', 'uid'],
      );
      const uid = _.get(dc, ['metadata', 'uid']);
      if (targetNode) {
        edges.push({
          id: `${uid}_${targetNode}`,
          type: TYPE_SERVICE_BINDING,
          source: uid,
          target: targetNode,
          data: { sbr },
        });
      }
    });
  });

  return edges;
};

/**
 * create groups data for graph
 */
export const getTopologyGroupItems = (dc: K8sResourceKind): Group => {
  const groupName = _.get(dc, ['metadata', 'labels', 'app.kubernetes.io/part-of']);
  if (!groupName) {
    return null;
  }

  return {
    id: `group:${groupName}`,
    type: TYPE_APPLICATION_GROUP,
    name: groupName,
    nodes: [_.get(dc, ['metadata', 'uid'])],
  };
};

export const mergeGroup = (newGroup: Group, existingGroups: Group[]): void => {
  if (!newGroup) {
    return;
  }

  // find and add the groups
  const existingGroup = existingGroups.find((g) => g.id === newGroup.id);
  if (!existingGroup) {
    existingGroups.push(newGroup);
  } else {
    newGroup.nodes.forEach((id) => {
      if (!existingGroup.nodes.includes(id)) {
        existingGroup.nodes.push(id);
      }
    });
  }
};

export const mergeGroups = (newGroups: Group[], existingGroups: Group[]): void => {
  if (!newGroups || !newGroups.length) {
    return;
  }
  newGroups.forEach((newGroup) => {
    mergeGroup(newGroup, existingGroups);
  });
};

export const addToTopologyDataModel = (
  newModel: TopologyDataModel,
  graphModel: TopologyDataModel,
) => {
  graphModel.graph.nodes.push(...newModel.graph.nodes);
  graphModel.graph.edges.push(...newModel.graph.edges);
  mergeGroups(newModel.graph.groups, graphModel.graph.groups);
  graphModel.topology = {
    ...graphModel.topology,
    ...newModel.topology,
  };
};
