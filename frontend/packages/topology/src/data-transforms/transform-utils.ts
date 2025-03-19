import { Model, NodeModel } from '@patternfly/react-topology';
import i18next from 'i18next';
import * as _ from 'lodash';
import {
  WatchK8sResources,
  WatchK8sResults,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  GetTopologyEdgeItems,
  GetTopologyGroupItems,
  GetTopologyNodeItem,
  GetWorkloadResources,
  MergeGroup,
} from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { Alerts } from '@console/internal/components/monitoring/types';
import { BuildConfigModel, HorizontalPodAutoscalerModel } from '@console/internal/models';
import {
  apiVersionForReference,
  isGroupVersionKind,
  K8sResourceKind,
  kindForReference,
  referenceFor,
} from '@console/internal/module/k8s';
import {
  TYPE_EVENT_SOURCE,
  TYPE_EVENT_SOURCE_KAFKA,
  TYPE_KNATIVE_REVISION,
} from '@console/knative-plugin/src/topology/const';
import { isKnativeServing, OverviewItem } from '@console/shared';
import {
  TYPE_APPLICATION_GROUP,
  TYPE_CONNECTS_TO,
  NODE_WIDTH,
  NODE_HEIGHT,
  NODE_PADDING,
  GROUP_WIDTH,
  GROUP_HEIGHT,
  GROUP_PADDING,
} from '../const';
import {
  TopologyDataObject,
  TopologyDataModelDepicted,
  OdcNodeModel,
  TopologyResourcesObject,
} from '../topology-types';
import { ConnectsToData, edgesFromAnnotations } from '../utils/connector-utils';
import { WORKLOAD_TYPES } from '../utils/topology-utils';

export const dataObjectFromModel = (node: OdcNodeModel): TopologyDataObject => {
  return {
    id: node.id,
    name: node.label,
    type: node.type,
    resource: node.resource,
    resources: null,
    data: null,
  };
};

export const getContextDirByName = (data, name) => {
  if (!data?.builds && !data?.buildConfigs && !data?.pipelines) {
    return null;
  }

  const extractContextDir = (item) => item.spec?.source?.contextDir ?? null;
  const buildsData = data?.builds?.data?.find(
    (build: K8sResourceKind) => build.metadata.name === name,
  );
  if (buildsData) {
    const contextDir = extractContextDir(buildsData);
    return contextDir;
  }

  const buildConfigData = data?.buildConfigs?.data?.find(
    (buildConfig: K8sResourceKind) => buildConfig.metadata.name === name,
  );
  if (buildConfigData) {
    const contextDir = extractContextDir(buildConfigData);
    return contextDir;
  }

  const pipelinesData = data?.pipelines?.data?.find(
    (pipeline: K8sResourceKind) => pipeline.metadata.name === name,
  );
  if (pipelinesData) {
    const pathContextParam = pipelinesData?.spec?.params?.find(
      (param) => param.name === 'PATH_CONTEXT',
    );
    if (pathContextParam) {
      return pathContextParam.default;
    }
  }
  return null;
};

/**
 * create all data that need to be shown on a topology data
 */
export const createTopologyNodeData = (
  resource: K8sResourceKind,
  overviewItem: OverviewItem,
  type: string,
  defaultIcon: string,
  operatorBackedService: boolean = false,
  resources?: WatchK8sResults<TopologyResourcesObject> | { [x: string]: Alerts },
): TopologyDataObject => {
  const { monitoringAlerts = [] } = overviewItem;
  const dcUID = _.get(resource, 'metadata.uid');
  const deploymentsLabels = _.get(resource, 'metadata.labels', {});
  const deploymentsAnnotations = _.get(resource, 'metadata.annotations', {});
  const deploymentsName = _.get(resource, 'metadata.name', '');
  const contextDir = getContextDirByName(resources, deploymentsName);
  const builderImageIcon =
    getImageForIconClass(`icon-${deploymentsLabels['app.openshift.io/runtime']}`) ||
    getImageForIconClass(`icon-${deploymentsLabels['app.kubernetes.io/name']}`);
  return {
    id: dcUID,
    name: resource?.metadata.name || deploymentsLabels['app.kubernetes.io/instance'],
    type,
    resource,
    resources: { ...overviewItem, isOperatorBackedService: operatorBackedService },
    data: {
      monitoringAlerts,
      kind: referenceFor(resource),
      editURL: deploymentsAnnotations['app.openshift.io/edit-url'],
      vcsURI: deploymentsAnnotations['app.openshift.io/vcs-uri'],
      vcsRef: deploymentsAnnotations['app.openshift.io/vcs-ref'],
      contextDir,
      builderImage: builderImageIcon || defaultIcon,
      isKnativeResource:
        type &&
        (type === TYPE_EVENT_SOURCE ||
          type === TYPE_KNATIVE_REVISION ||
          type === TYPE_EVENT_SOURCE_KAFKA)
          ? true
          : isKnativeServing(resource, 'metadata.labels'),
    },
  };
};

/**
 * create node data for graphs
 */
export const getTopologyNodeItem: GetTopologyNodeItem = (
  resource,
  type,
  data,
  nodeProps,
  children,
  resourceKind,
  shape,
) => {
  const uid = resource?.metadata.uid;
  const name = resource?.metadata.name;
  const label = resource?.metadata.labels?.['app.openshift.io/instance'];
  const kind = resourceKind || referenceFor(resource);
  return {
    id: uid,
    type,
    label: label || name,
    shape,
    resource,
    resourceKind: kind,
    data,
    ...(children && children.length && { children }),
    ...(nodeProps || {}),
  };
};

export const WorkloadModelProps = {
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
  group: false,
  visible: true,
  style: {
    padding: NODE_PADDING,
  },
};

/**
 * create edge data for graph
 */
export const getTopologyEdgeItems: GetTopologyEdgeItems = (dc, resources) => {
  const annotations = _.get(dc, 'metadata.annotations');
  const edges = [];

  _.forEach(edgesFromAnnotations(annotations), (edge: string | ConnectsToData) => {
    // handles multiple edges
    const targetNode = _.get(
      _.find(resources, (deployment) => {
        let name;
        if (typeof edge === 'string') {
          name =
            deployment.metadata?.labels?.['app.kubernetes.io/instance'] ??
            deployment.metadata?.name;
          return name === edge;
        }
        name = deployment.metadata?.name;
        const { apiVersion: edgeApiVersion, kind: edgeKind, name: edgeName } = edge;
        const { kind, apiVersion } = deployment;
        let edgeExists = name === edgeName && kind === edgeKind;
        if (apiVersion) {
          edgeExists = edgeExists && apiVersion === edgeApiVersion;
        }
        return edgeExists;
      }),
      ['metadata', 'uid'],
    );
    const uid = _.get(dc, ['metadata', 'uid']);
    if (targetNode) {
      edges.push({
        id: `${uid}_${targetNode}`,
        type: TYPE_CONNECTS_TO,
        label: i18next.t('topology~Visual connector'),
        source: uid,
        target: targetNode,
      });
    }
  });

  return edges;
};

/**
 * create groups data for graph
 */
export const getTopologyGroupItems: GetTopologyGroupItems = (dc) => {
  const groupName = _.get(dc, ['metadata', 'labels', 'app.kubernetes.io/part-of']);
  if (!groupName) {
    return null;
  }

  return {
    id: `group:${groupName}`,
    type: TYPE_APPLICATION_GROUP,
    group: true,
    label: groupName,
    children: [_.get(dc, ['metadata', 'uid'])],
    width: GROUP_WIDTH,
    height: GROUP_HEIGHT,
    data: {},
    visible: true,
    collapsed: false,
    style: {
      padding: GROUP_PADDING,
    },
  };
};

const mergeGroupData = (newGroup: NodeModel, existingGroup: NodeModel): void => {
  if (!existingGroup.data?.groupResources && !newGroup.data?.groupResources) {
    return;
  }

  if (!existingGroup.data?.groupResources) {
    existingGroup.data.groupResources = [];
  }
  if (newGroup?.data?.groupResources) {
    newGroup.data.groupResources.forEach((obj) => {
      if (!existingGroup.data.groupResources.includes(obj)) {
        existingGroup.data.groupResources.push(obj);
      }
    });
  }
};

export const mergeGroup: MergeGroup = (newGroup, existingGroups) => {
  if (!newGroup) {
    return;
  }

  // Remove any children from the new group that already belong to another group
  newGroup.children = newGroup.children?.filter(
    (c) => !existingGroups?.find((g) => g.children?.includes(c)),
  );

  // find and add the groups
  const existingGroup = existingGroups.find((g) => g.group && g.id === newGroup.id);
  if (!existingGroup) {
    existingGroups.push(newGroup);
  } else {
    newGroup.children.forEach((id) => {
      if (!existingGroup.children.includes(id)) {
        existingGroup.children.push(id);
      }
      mergeGroupData(newGroup, existingGroup);
    });
  }
};

export const mergeGroups = (newGroups: NodeModel[], existingGroups: NodeModel[]): void => {
  if (!newGroups || !newGroups.length) {
    return;
  }
  newGroups.forEach((newGroup) => {
    mergeGroup(newGroup, existingGroups);
  });
};

export const addToTopologyDataModel = (
  newModel: Model,
  graphModel: Model,
  dataModelDepicters: TopologyDataModelDepicted[] = [],
) => {
  if (newModel?.edges) {
    graphModel.edges.push(...newModel.edges);
  }
  if (newModel?.nodes) {
    graphModel.nodes.push(
      ...newModel.nodes.filter(
        (n) =>
          !n.group &&
          !graphModel.nodes.find((existing) => {
            if (n.id === existing.id) {
              return true;
            }
            const { resource } = n as OdcNodeModel;
            return (
              !resource || !!dataModelDepicters.find((depicter) => depicter(resource, graphModel))
            );
          }),
      ),
    );
    mergeGroups(
      newModel.nodes.filter((n) => n.group),
      graphModel.nodes,
    );
  }
};

/**
 * Mapping of TopologyResourcesObject key to k8s resource kind
 */

export const getWorkloadResources: GetWorkloadResources = (
  resources,
  kindsMap,
  workloadTypes = WORKLOAD_TYPES,
) => {
  return _.flatten(
    workloadTypes.map((resourceKind) => {
      return resources[resourceKind]
        ? resources[resourceKind].data.map((res) => {
            const resKind = res.kind || kindsMap[resourceKind];
            let kind = resKind;
            let apiVersion;
            if (resKind && isGroupVersionKind(resKind)) {
              kind = kindForReference(resKind);
              apiVersion = apiVersionForReference(resKind);
            }
            return {
              kind,
              apiVersion,
              ...res,
            };
          })
        : [];
    }),
  );
};

export const getBaseWatchedResources = (namespace: string): WatchK8sResources<any> => {
  return {
    deploymentConfigs: {
      isList: true,
      kind: 'DeploymentConfig',
      namespace,
      optional: true,
    },
    deployments: {
      isList: true,
      kind: 'Deployment',
      namespace,
      optional: true,
    },
    daemonSets: {
      isList: true,
      kind: 'DaemonSet',
      namespace,
      optional: true,
    },
    pods: {
      isList: true,
      kind: 'Pod',
      namespace,
      optional: true,
    },
    jobs: {
      isList: true,
      kind: 'Job',
      namespace,
      optional: true,
    },
    cronJobs: {
      isList: true,
      kind: 'CronJob',
      namespace,
      optional: true,
    },
    statefulSets: {
      isList: true,
      kind: 'StatefulSet',
      namespace,
      optional: true,
    },
    services: {
      isList: true,
      kind: 'Service',
      namespace,
      optional: true,
    },
    hpas: {
      isList: true,
      kind: HorizontalPodAutoscalerModel.kind,
      namespace,
      optional: true,
    },
    buildConfigs: {
      isList: true,
      kind: BuildConfigModel.kind,
      namespace,
      optional: true,
    },
  };
};
