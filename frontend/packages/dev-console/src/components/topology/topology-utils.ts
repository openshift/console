import * as _ from 'lodash';
import { EdgeModel, Model, NodeModel, NodeShape, createAggregateEdges } from '@console/topology';
import {
  K8sResourceKind,
  modelFor,
  DeploymentKind,
  referenceFor,
} from '@console/internal/module/k8s';
import { getRouteWebURL } from '@console/internal/components/routes';
import {
  TransformResourceData,
  isKnativeServing,
  OverviewItem,
  getImageForCSVIcon,
  getDefaultOperatorIcon,
} from '@console/shared';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import {
  tranformKnNodeData,
  filterNonKnativeDeployments,
  filterRevisionsByActiveApplication,
  createKnativeEventSourceSink,
  NodeType,
} from '@console/knative-plugin/src/utils/knative-topology-utils';
import {
  edgesFromAnnotations,
  createResourceConnection,
  updateResourceApplication,
  removeResourceConnection,
  createServiceBinding,
  removeServiceBinding,
  edgesFromServiceBinding,
  getOperatorBackedServiceKindMap,
} from '../../utils/application-utils';
import { TopologyFilters } from './filters/filter-utils';
import {
  TopologyDataModel,
  TopologyDataResources,
  TopologyDataObject,
  Node,
  Edge,
  Group,
  TopologyOverviewItem,
  OperatorBackedServiceKindMap,
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
} from './const';

export const allowedResources = ['deployments', 'deploymentConfigs', 'daemonSets', 'statefulSets'];

export const getCheURL = (consoleLinks: K8sResourceKind[]) =>
  _.get(_.find(consoleLinks, ['metadata.name', 'che']), 'spec.href', '');

export const getEditURL = (gitURL: string, cheURL: string) => {
  return gitURL && cheURL ? `${cheURL}/f?url=${gitURL}&policies.create=peruser` : gitURL;
};

export const isHelmReleaseNode = (obj: K8sResourceKind): boolean => {
  return obj?.metadata?.labels?.['heritage'] === 'Helm' || !!obj?.metadata?.labels?.['charts'];
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

/**
 * get monitoring status
 */
export const isEventWarning = (resource: OverviewItem): boolean => {
  const { events } = resource;
  if (!events) return false;
  const eventStatus = _.filter(events, ['type', 'Warning']);
  return !!eventStatus.length;
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
      eventWarning: isEventWarning(dc),
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
  if (isHelmReleaseNode(dc)) {
    return {
      id: uid,
      type: TYPE_HELM_WORKLOAD,
      name: label || name,
      ...(children && children.length && { children }),
    };
  }
  return {
    id: uid,
    type: type || 'workload',
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
        type: 'connects-to',
        source: uid,
        target: targetNode,
      });
    }
  });

  _.forEach(edgesFromServiceBinding(dc, sbrs), (sbr) => {
    // handles multiple edges
    const targetNode = _.get(
      _.find(resources, (deployment) => {
        const targetFound =
          _.get(deployment, 'metadata.ownerReferences[0].name') ===
            sbr.spec.backingServiceSelector.resourceRef &&
          _.get(deployment, 'metadata.ownerReferences[0].kind') ===
            sbr.spec.backingServiceSelector.kind;
        const appGroup = _.get(
          deployment,
          ['metadata', 'labels', 'app.kubernetes.io/part-of'],
          null,
        );
        return targetFound && (!application || application === appGroup);
      }),
      ['metadata', 'uid'],
    );
    const uid = _.get(dc, ['metadata', 'uid']);
    if (targetNode) {
      edges.push({
        id: `${uid}_${targetNode}`,
        type: 'service-binding',
        source: uid,
        target: targetNode,
        data: { sbr },
      });
    }
  });

  return edges;
};

export const getTopologyHelmReleaseGroupItem = (obj: K8sResourceKind, groups: Group[]): Group[] => {
  const releaseLabel = _.get(obj, ['metadata', 'labels', 'release'], null);
  const uid = _.get(obj, ['metadata', 'uid'], null);
  if (!releaseLabel) return groups;
  const releaseExists = _.some(groups, { name: releaseLabel });
  if (!releaseExists) {
    groups.push({
      id: `${TYPE_HELM_RELEASE}:${releaseLabel}`,
      type: TYPE_HELM_RELEASE,
      name: releaseLabel,
      nodes: [uid],
    });
  } else {
    const gIndex = _.findIndex(groups, { name: releaseLabel });
    groups[gIndex].nodes.push(uid);
  }
  return groups;
};

/**
 * create groups data for graph
 * @param dc
 * @param groups
 */
export const getTopologyGroupItems = (dc: K8sResourceKind, groups: Group[]): Group[] => {
  if (isHelmReleaseNode(dc)) {
    return getTopologyHelmReleaseGroupItem(dc, groups);
  }
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
  return groups;
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
      _.map(resources[key].data, (deployment) => {
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

  const transformResourceData = createInstanceForResource(resources, utils);
  const allResources = _.flatten(
    allowedResources.map((resourceKind) => {
      return resources[resourceKind]
        ? filterBasedOnActiveApplication(resources[resourceKind].data, application)
        : [];
    }),
  );

  _.forEach(transformBy, (key) => {
    if (!_.isEmpty(resources[key].data)) {
      // filter data based on the active application
      const resourceData = filterBasedOnActiveApplication(resources[key].data, application);
      let nodesData = [];
      let edgesData = [];
      let groupsData = topologyGraphAndNodeData.graph.groups;
      const dataToShowOnNodes = {};

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
          const nodeType = operatorBacked ? TYPE_OPERATOR_WORKLOAD : TYPE_WORKLOAD;
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
            groupsData = [
              ...getTopologyGroupItems(deploymentConfig, topologyGraphAndNodeData.graph.groups),
            ];
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
  );
  return topologyGraphAndNodeData;
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

export const topologyModelFromDataModel = (
  dataModel: TopologyDataModel,
  filters?: TopologyFilters,
): Model => {
  const nodes: NodeModel[] = dataModel.graph.nodes.map((d) => {
    if (d.type === TYPE_KNATIVE_SERVICE || d.type === TYPE_OPERATOR_BACKED_SERVICE) {
      const data: TopologyDataObject = dataModel.topology[d.id] || dataObjectFromModel(d);
      data.groupResources = d.children && d.children.map((id) => dataModel.topology[id]);
      return {
        width: 300,
        height: 100,
        id: d.id,
        type: d.type,
        label: dataModel.topology[d.id].name,
        data,
        collapsed: filters && !filters.display.knativeServices,
        children: d.children,
        group: d.children?.length > 0,
        shape: NodeShape.rect,
        style: {
          padding: [40, 50, 40, 40],
        },
      };
    }
    return {
      width: 104,
      height: 104,
      id: d.id,
      type: d.type,
      label: dataModel.topology[d.id].name,
      data: dataModel.topology[d.id],
    };
  });

  const groupNodes: NodeModel[] = dataModel.graph.groups.map((d) => {
    const data: TopologyDataObject = dataModel.topology[d.id] || dataObjectFromModel(d);
    data.groupResources = d.nodes.map((id) => dataModel.topology[id]);
    return {
      width: 300,
      height: 180,
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
        padding: 40,
      },
    };
  });

  // create links from data
  const edges = dataModel.graph.edges.map(
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
    nodes: [...nodes, ...groupNodes],
    edges: createAggregateEdges(TYPE_AGGREGATE_EDGE, edges, [...nodes, ...groupNodes]),
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

  const resource = getTopologyResourceObject(item);

  const resourceKind = modelFor(referenceFor(resource));
  if (!resourceKind) {
    return Promise.reject(
      new Error(`Unable to update application, invalid resource type: ${resource.kind}`),
    );
  }
  return updateResourceApplication(resourceKind, resource, application);
};

export const createTopologyResourceConnection = (
  source: TopologyDataObject,
  target: TopologyDataObject,
  replaceTarget: TopologyDataObject = null,
  serviceBindingFlag: boolean,
): Promise<K8sResourceKind[] | K8sResourceKind> => {
  if (!source || !target || source === target) {
    return Promise.reject();
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
          .catch(resolve);
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
