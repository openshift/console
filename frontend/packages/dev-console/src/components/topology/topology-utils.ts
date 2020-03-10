import * as _ from 'lodash';
import { EdgeModel, Model, NodeModel, NodeShape, createAggregateEdges } from '@console/topology';
import {
  K8sResourceKind,
  modelFor,
  DeploymentKind,
  referenceFor,
} from '@console/internal/module/k8s';
import { SecretModel } from '@console/internal/models';
import { getRouteWebURL } from '@console/internal/components/routes';
import {
  TransformResourceData,
  isKnativeServing,
  OverviewItem,
  getImageForCSVIcon,
  getDefaultOperatorIcon,
  OperatorBackedServiceKindMap,
  getOperatorBackedServiceKindMap,
} from '@console/shared';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import {
  tranformKnNodeData,
  filterNonKnativeDeployments,
  filterRevisionsByActiveApplication,
  createKnativeEventSourceSink,
  NodeType,
} from '@console/knative-plugin/src/utils/knative-topology-utils';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import {
  edgesFromAnnotations,
  createResourceConnection,
  updateResourceApplication,
  removeResourceConnection,
  createServiceBinding,
  removeServiceBinding,
  edgesFromServiceBinding,
} from '../../utils/application-utils';
import { TopologyFilters } from './filters/filter-utils';
import {
  TopologyDataModel,
  TopologyDataResources,
  TopologyDataObject,
  TopologyDataMap,
  Node,
  Edge,
  Group,
  TopologyOverviewItem,
  TrafficData,
  KialiNode,
} from './topology-types';
import {
  TYPE_APPLICATION_GROUP,
  TYPE_KNATIVE_SERVICE,
  TYPE_HELM_RELEASE,
  TYPE_HELM_WORKLOAD,
  TYPE_AGGREGATE_EDGE,
  TYPE_OPERATOR_BACKED_SERVICE,
  TYPE_OPERATOR_WORKLOAD,
  TYPE_TRAFFIC_CONNECTOR,
  TYPE_WORKLOAD,
  TYPE_CONNECTS_TO,
  TYPE_SERVICE_BINDING,
  NODE_WIDTH,
  NODE_HEIGHT,
  NODE_PADDING,
  GROUP_WIDTH,
  GROUP_HEIGHT,
  GROUP_PADDING,
  KNATIVE_GROUP_NODE_HEIGHT,
  KNATIVE_GROUP_NODE_PADDING,
} from './const';
import { HelmReleaseResourcesMap } from '../helm/helm-types';

export const allowedResources = ['deployments', 'deploymentConfigs', 'daemonSets', 'statefulSets'];

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
export const getRoutesUrl = (resource: OverviewItem): string => {
  const { routes, ksroutes } = resource;
  if (routes.length > 0 && !_.isEmpty(routes[0].spec)) {
    return getRouteWebURL(routes[0]);
  }
  return getRouteData(ksroutes, resource);
};

const dataObjectFromModel = (node: Node | Group): TopologyDataObject => {
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
 * @param resources
 * @param utils
 */
const createInstanceForResource = (
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
 * @param dc resource item
 * @param cheURL che link
 */
export const createTopologyNodeData = (
  dc: TopologyOverviewItem,
  operatorBackedServiceKindMap: OperatorBackedServiceKindMap,
  cheURL?: string,
  type?: string,
  filters?: TopologyFilters,
  installedOperators?: K8sResourceKind[],
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
  const nodeResourceKind = _.get(deploymentConfig, 'metadata.ownerReferences[0].kind');
  const ownerUid = _.get(deploymentConfig, 'metadata.ownerReferences[0].uid');
  const operatorResource: K8sResourceKind = _.find(installedOperators, {
    metadata: { uid: ownerUid },
  }) as K8sResourceKind;
  const operatorBackedService =
    !_.isEmpty(operatorResource) || nodeResourceKind in operatorBackedServiceKindMap;

  const csvIcon =
    operatorBackedService &&
    getImageForCSVIcon(_.get(operatorBackedServiceKindMap[nodeResourceKind], 'spec.icon.0'));
  const builderImageIcon =
    getImageForIconClass(`icon-${deploymentsLabels['app.openshift.io/runtime']}`) ||
    getImageForIconClass(`icon-${deploymentsLabels['app.kubernetes.io/name']}`);
  const defaultIcon = operatorBackedService
    ? getDefaultOperatorIcon()
    : getImageForIconClass(`icon-openshift`);
  const nodeType = operatorBackedService ? TYPE_OPERATOR_WORKLOAD : TYPE_WORKLOAD;
  return {
    id: dcUID,
    name:
      _.get(deploymentConfig, 'metadata.name') || deploymentsLabels['app.kubernetes.io/instance'],
    type: type || nodeType,
    resources: { ...dc, isOperatorBackedService: operatorBackedService },
    pods: dc.pods,
    operatorBackedService,
    data: {
      url: getRoutesUrl(dc),
      kind: referenceFor(deploymentConfig),
      editUrl:
        deploymentsAnnotations['app.openshift.io/edit-url'] ||
        getEditURL(deploymentsAnnotations['app.openshift.io/vcs-uri'], cheURL),
      cheEnabled: !!cheURL,
      builderImage: builderImageIcon || csvIcon || defaultIcon,
      isKnativeResource:
        type && (type === 'event-source' || 'knative-revision')
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
      showPodCount: filters && filters.display.podCount,
    },
  };
};

/**
 * create node data for graphs
 * @param dc resource
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
 * @param dc
 * @param resources
 */
export const getTopologyEdgeItems = (
  dc: K8sResourceKind,
  resources: K8sResourceKind[],
  sbrs: K8sResourceKind[],
  application?: string,
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
        const appGroup = _.get(
          deployment,
          ['metadata', 'labels', 'app.kubernetes.io/part-of'],
          null,
        );
        return name === edge && (!application || application === appGroup);
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
          const targetFound = bss.kind === kind && bss.resourceRef === name;
          if (targetFound) {
            const appGroup = _.get(
              deployment,
              ['metadata', 'labels', 'app.kubernetes.io/part-of'],
              null,
            );
            return !application || application === appGroup;
          }
          return false;
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
 * @param dc
 * @param groups
 */
export const getTopologyGroupItems = (dc: K8sResourceKind, groups: Group[]): void => {
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
        type: TYPE_APPLICATION_GROUP,
        name: label,
        nodes: [uid],
      });
    } else {
      const gIndex = _.findIndex(groups, { name: label });
      if (!groups[gIndex].nodes.includes(uid)) {
        groups[gIndex].nodes.push(uid);
      }
    }
  });
};

export const getTopologyHelmReleaseGroupItem = (
  obj: K8sResourceKind,
  groups: Group[],
  helmResourcesMap: HelmReleaseResourcesMap,
  secrets: K8sResourceKind[],
  dataToShowOnNodes: TopologyDataMap,
): void => {
  const resourceKindName = getHelmReleaseKey(obj);
  const helmResources = helmResourcesMap[resourceKindName];
  const releaseName = helmResources?.releaseName;
  const uid = _.get(obj, ['metadata', 'uid'], null);

  if (!releaseName) return;

  const releaseExists = _.some(groups, { name: releaseName });

  if (!releaseExists) {
    const secret = secrets.find((nextSecret) => {
      const { labels } = nextSecret.metadata;
      return labels && labels.name && labels.name.includes(releaseName);
    });
    const helmGroup = {
      id: `${TYPE_HELM_RELEASE}:${releaseName}`,
      type: TYPE_HELM_RELEASE,
      name: releaseName,
      nodes: [uid],
    };

    if (secret) {
      helmGroup.id = secret.metadata.uid;
      getTopologyGroupItems(secret, groups);
    }

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
    dataToShowOnNodes[helmGroup.id] = dataModel;
    groups.push(helmGroup);
    return;
  }

  const gIndex = _.findIndex(groups, { name: releaseName });
  groups[gIndex].nodes.push(uid);
};

/**
 * Creates the operator backed services topology data
 * @param resources
 * @param transformBy
 * @param installedOperators
 * @param operatorBackedServiceKindMap
 * @param topologyGraphAndNodeData
 */
const getOperatoarBackedServiceData = (
  resources: TopologyDataResources,
  transformBy: string[],
  installedOperators: K8sResourceKind[],
  operatorBackedServiceKindMap: OperatorBackedServiceKindMap,
  topologyGraphAndNodeData: TopologyDataModel,
  application: string,
): TopologyDataModel => {
  const obsGroups = {};
  const operatorMap = {};
  let obsNodeItems = [];
  const obsTopology = {};
  const {
    graph: { nodes, edges, groups },
    topology,
  } = topologyGraphAndNodeData;
  _.forEach(transformBy, (key) => {
    if (!_.isEmpty(resources[key].data)) {
      const resourceData = filterBasedOnActiveApplication(resources[key].data, application);
      _.map(resourceData, (deployment) => {
        const nodeResourceKind = _.get(deployment, 'metadata.ownerReferences[0].kind');
        const ownerUid = _.get(deployment, 'metadata.ownerReferences[0].uid');
        const appGroup = _.get(deployment, ['metadata', 'labels', 'app.kubernetes.io/part-of']);
        let operator: K8sResourceKind = _.find(installedOperators, {
          metadata: { uid: ownerUid },
        }) as K8sResourceKind;

        if (_.isEmpty(operator)) {
          operator = operatorBackedServiceKindMap[nodeResourceKind];
        }
        if (operator) {
          const operatorName = appGroup
            ? `${appGroup}:${operator.metadata.name}`
            : operator.metadata.name;
          if (!(operatorName in obsGroups)) {
            obsGroups[operatorName] = [];
          }
          operatorMap[operatorName] = _.merge({}, operator, {
            metadata: {
              uid: `${operatorName}:${operator.metadata.uid}`,
            },
          });
          obsGroups[operatorName].push(deployment.metadata.uid);
          if (appGroup) {
            getTopologyGroupItems(
              _.merge({}, deployment, {
                metadata: {
                  uid: `${operatorName}:${operator.metadata.uid}`,
                },
              }),
              groups,
            );
          }
        }
      });
    }
  });

  _.forIn(obsGroups, (children, grp) => {
    obsNodeItems = [
      ...obsNodeItems,
      getTopologyNodeItem(operatorMap[grp], TYPE_OPERATOR_BACKED_SERVICE, children),
    ];
    obsTopology[operatorMap[grp].metadata.uid] = {
      id: operatorMap[grp].metadata.uid,
      name: operatorMap[grp].metadata.name,
      type: TYPE_OPERATOR_BACKED_SERVICE,
      resources: { obj: operatorMap[grp] },
      operatorBackedService: true,
      data: {
        builderImage:
          getImageForCSVIcon(_.get(operatorMap[grp], 'spec.icon.0')) || getDefaultOperatorIcon(),
      },
    };
  });
  return {
    graph: {
      nodes: [...nodes, ...obsNodeItems],
      edges: [...edges],
      groups: [...groups],
    },
    topology: { ...topology, ...obsTopology },
  };
};

export const getFilteredTrafficWorkload = (nodes: KialiNode[]): KialiNode[] =>
  nodes.filter(({ data }) => data.nodeType === TYPE_WORKLOAD);

export const getTrafficConnectors = (
  trafficData: TrafficData,
  resources: K8sResourceKind[],
): Edge[] => {
  const filteredWorkload = getFilteredTrafficWorkload(trafficData.nodes);
  return trafficData.edges.reduce((acc, { data }) => {
    const { data: sourceTrafficNode } = filteredWorkload.find(
      (wrkld) => wrkld.data.id === data.source,
    );
    const { data: targetTrafficNode } = filteredWorkload.find(
      (wrkld) => wrkld.data.id === data.target,
    );
    const sourceResourceNode = resources.find((res) => {
      return res.metadata.name === sourceTrafficNode[sourceTrafficNode.nodeType];
    });
    const targetResourceNode = resources.find(
      (res) => res.metadata.name === targetTrafficNode[targetTrafficNode.nodeType],
    );
    return sourceResourceNode && targetResourceNode
      ? [
          ...acc,
          {
            id: `${sourceResourceNode.metadata.uid}_${targetResourceNode.metadata.uid}`,
            type: TYPE_TRAFFIC_CONNECTOR,
            source: sourceResourceNode.metadata.uid,
            target: targetResourceNode.metadata.uid,
            data: data.traffic,
          },
        ]
      : acc;
  }, []);
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
  filters?: TopologyFilters,
  trafficData?: TrafficData,
  helmResourcesMap?: HelmReleaseResourcesMap,
): TopologyDataModel => {
  const installedOperators = _.get(resources, 'clusterServiceVersions.data');
  const operatorBackedServiceKindMap = getOperatorBackedServiceKindMap(installedOperators);
  const serviceBindingRequests = _.get(resources, 'serviceBindingRequests.data');
  let topologyGraphAndNodeData: TopologyDataModel = {
    graph: { nodes: [], edges: [], groups: [] },
    topology: {},
  };
  if (trafficData)
    topologyGraphAndNodeData.graph.edges = getTrafficConnectors(trafficData, [
      ...resources.deploymentConfigs.data,
      ...resources.deployments.data,
      ...resources.statefulSets.data,
      ...resources.daemonSets.data,
    ]);

  /**
   * form data model specific to knative resources
   */
  const getKnativeTopologyData = (knativeResources: K8sResourceKind[], type: string) => {
    const activeAppKnResource =
      type !== NodeType.Revision
        ? filterBasedOnActiveApplication(knativeResources, application)
        : filterRevisionsByActiveApplication(knativeResources, resources, application);
    if (activeAppKnResource && activeAppKnResource.length) {
      const knativeResourceData = tranformKnNodeData(
        activeAppKnResource,
        type,
        topologyGraphAndNodeData,
        resources,
        operatorBackedServiceKindMap,
        utils,
        cheURL,
        application,
        filters,
      );
      const {
        graph: { nodes, edges },
        topology,
      } = topologyGraphAndNodeData;
      topologyGraphAndNodeData = {
        graph: {
          nodes: [...nodes, ...knativeResourceData.nodesData],
          edges: [...edges, ...knativeResourceData.edgesData],
          groups: [...knativeResourceData.groupsData],
        },
        topology: { ...topology, ...knativeResourceData.dataToShowOnNodes },
      };
    }
  };

  const getKnativeEventSources = (): K8sResourceKind[] => {
    const allEventSourcesResources = _.concat(
      _.get(resources, 'eventSourceCronjob.data', []),
      _.get(resources, 'eventSourceContainers.data', []),
      _.get(resources, 'eventSourceApiserver.data', []),
      _.get(resources, 'eventSourceCamel.data', []),
      _.get(resources, 'eventSourceKafka.data', []),
    );
    return allEventSourcesResources;
  };

  const knSvcResources: K8sResourceKind[] = _.get(resources, ['ksservices', 'data'], []);
  knSvcResources.length && getKnativeTopologyData(knSvcResources, NodeType.KnService);
  const knEventSources: K8sResourceKind[] =
    filters && filters.display.eventSources ? getKnativeEventSources() : [];
  knEventSources.length && getKnativeTopologyData(knEventSources, NodeType.EventSource);
  const knRevResources: K8sResourceKind[] = _.get(resources, ['revisions', 'data'], []);
  knRevResources.length && getKnativeTopologyData(knRevResources, NodeType.Revision);
  const deploymentResources: DeploymentKind[] = _.get(resources, ['deployments', 'data'], []);
  resources.deployments.data = filterNonKnativeDeployments(deploymentResources);
  // END: kn call to form topology data

  const transformResourceData = createInstanceForResource(resources, utils, installedOperators);
  const allResources = _.flatten(
    allowedResources.map((resourceKind) => {
      return resources[resourceKind]
        ? filterBasedOnActiveApplication(resources[resourceKind].data, application)
        : [];
    }),
  );

  const secrets = _.get(resources, 'secrets.data', []);
  _.forEach(transformBy, (key) => {
    if (!_.isEmpty(resources[key].data)) {
      // filter data based on the active application
      const resourceData = filterBasedOnActiveApplication(resources[key].data, application);
      let nodesData = [];
      let edgesData = [];
      const groupsData = topologyGraphAndNodeData.graph.groups;
      const dataToShowOnNodes: TopologyDataMap = {};

      transformResourceData[key](resourceData).forEach((item) => {
        const { obj: deploymentConfig } = item;
        const uid = _.get(deploymentConfig, ['metadata', 'uid']);
        dataToShowOnNodes[uid] = createTopologyNodeData(
          item,
          operatorBackedServiceKindMap,
          cheURL,
          null,
          filters,
          installedOperators,
        );
        if (!_.some(topologyGraphAndNodeData.graph.nodes, { id: uid })) {
          const operatorBacked = dataToShowOnNodes[uid].operatorBackedService;
          const nodeType = operatorBacked
            ? TYPE_OPERATOR_WORKLOAD
            : isHelmReleaseNode(deploymentConfig, helmResourcesMap)
            ? TYPE_HELM_WORKLOAD
            : TYPE_WORKLOAD;

          nodesData = [...nodesData, getTopologyNodeItem(deploymentConfig, nodeType)];
          edgesData = [
            ...edgesData,
            ...getTopologyEdgeItems(
              deploymentConfig,
              allResources,
              serviceBindingRequests,
              application,
            ),
          ];
          if (!operatorBacked) {
            if (!isHelmReleaseNode(deploymentConfig, helmResourcesMap)) {
              getTopologyGroupItems(deploymentConfig, groupsData);
            } else {
              getTopologyHelmReleaseGroupItem(
                deploymentConfig,
                groupsData,
                helmResourcesMap,
                secrets,
                dataToShowOnNodes,
              );
            }
          }
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
  topologyGraphAndNodeData = getOperatoarBackedServiceData(
    resources,
    transformBy,
    installedOperators,
    operatorBackedServiceKindMap,
    topologyGraphAndNodeData,
    application,
  );
  return topologyGraphAndNodeData;
};

export const topologyModelFromDataModel = (
  dataModel: TopologyDataModel,
  filters?: TopologyFilters,
): Model => {
  const nodes: NodeModel[] = dataModel.graph.nodes.map((d) => {
    if (d.type === TYPE_KNATIVE_SERVICE || d.type === TYPE_OPERATOR_BACKED_SERVICE) {
      const data: TopologyDataObject = dataModel.topology[d.id] || dataObjectFromModel(d);
      data.groupResources = d.children && d.children.map((id) => dataModel.topology[id]);
      return {
        width: GROUP_WIDTH,
        height: d.type === TYPE_KNATIVE_SERVICE ? KNATIVE_GROUP_NODE_HEIGHT : GROUP_HEIGHT,
        id: d.id,
        type: d.type,
        label: dataModel.topology[d.id].name,
        data,
        collapsed:
          filters &&
          ((d.type === TYPE_KNATIVE_SERVICE && !filters.display.knativeServices) ||
            (d.type === TYPE_OPERATOR_BACKED_SERVICE && !filters.display.operatorGrouping)),
        children: d.children,
        group: true,
        shape: NodeShape.rect,
        style: {
          padding: d.type === TYPE_KNATIVE_SERVICE ? KNATIVE_GROUP_NODE_PADDING : GROUP_PADDING,
        },
      };
    }
    return {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      id: d.id,
      type: d.type,
      label: dataModel.topology[d.id].name,
      data: dataModel.topology[d.id],
      style: {
        padding: NODE_PADDING,
      },
    };
  });

  const groupNodes: NodeModel[] = dataModel.graph.groups.map((d) => {
    const data: TopologyDataObject = dataModel.topology[d.id] || dataObjectFromModel(d);
    data.groupResources = d.nodes.map((id) => dataModel.topology[id]);
    return {
      width: GROUP_WIDTH,
      height: GROUP_HEIGHT,
      id: d.id,
      group: true,
      type: d.type,
      collapsed:
        filters &&
        ((d.type === TYPE_HELM_RELEASE && !filters.display.helmGrouping) ||
          (d.type === TYPE_APPLICATION_GROUP && !filters.display.appGrouping)),
      data,
      children: d.nodes,
      label: d.name,
      style: {
        padding: GROUP_PADDING,
      },
    };
  });

  // create links from data, only include those which have a valid source and target
  const allNodes = [...nodes, ...groupNodes];
  const edges = dataModel.graph.edges
    .filter((d) => {
      return allNodes.find((n) => n.id === d.source) && allNodes.find((n) => n.id === d.target);
    })
    .map(
      (d): EdgeModel => ({
        data: d,
        source: d.source,
        target: d.target,
        id: `${d.source}_${d.target}`,
        type: d.type,
      }),
    );

  // create topology model
  const model: Model = {
    nodes: allNodes,
    edges: createAggregateEdges(TYPE_AGGREGATE_EDGE, edges, allNodes),
  };

  return model;
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
  serviceBindingFlag: boolean,
): Promise<K8sResourceKind[] | K8sResourceKind> => {
  if (!source || !target || source === target) {
    return Promise.reject(new Error('Can not create a connection from a node to itself.'));
  }

  const sourceObj = getTopologyResourceObject(source);
  const targetObj = getTopologyResourceObject(target);
  const replaceTargetObj = replaceTarget && getTopologyResourceObject(replaceTarget);

  if (serviceBindingFlag && target.operatorBackedService) {
    if (replaceTarget) {
      return new Promise<K8sResourceKind[] | K8sResourceKind>((resolve, reject) => {
        createServiceBinding(sourceObj, targetObj)
          .then(() => {
            // eslint-disable-next-line promise/no-nesting
            removeResourceConnection(sourceObj, replaceTargetObj)
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      });
    }

    return createServiceBinding(sourceObj, targetObj);
  }

  return createResourceConnection(sourceObj, targetObj, replaceTargetObj);
};

export const createTopologySinkConnection = (
  source: TopologyDataObject,
  target: TopologyDataObject,
): Promise<K8sResourceKind> => {
  if (!source || !target || source === target) {
    return Promise.reject();
  }
  const sourceObj = getTopologyResourceObject(source);
  const targetObj = getTopologyResourceObject(target);

  return createKnativeEventSourceSink(sourceObj, targetObj);
};

export const removeTopologyResourceConnection = (
  source: TopologyDataObject,
  target: TopologyDataObject,
  sbr: K8sResourceKind,
  edgeType: string,
): Promise<any> => {
  if (!source || !target) {
    return Promise.reject();
  }

  const sourceObj = getTopologyResourceObject(source);
  const targetObj = getTopologyResourceObject(target);

  if (edgeType === 'service-binding') {
    return removeServiceBinding(sbr);
  }

  return removeResourceConnection(sourceObj, targetObj);
};
