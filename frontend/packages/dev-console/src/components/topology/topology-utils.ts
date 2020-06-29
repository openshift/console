import * as _ from 'lodash';
import {
  K8sResourceKind,
  modelFor,
  DeploymentKind,
  referenceFor,
} from '@console/internal/module/k8s';
import { getRouteWebURL } from '@console/internal/components/routes';
import { TransformResourceData, isKnativeServing, OverviewItem } from '@console/shared';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import {
  tranformKnNodeData,
  filterNonKnativeDeployments,
  filterRevisionsByActiveApplication,
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
} from '../../utils/application-utils';
import {
  TopologyDataModel,
  TopologyDataResources,
  TopologyDataObject,
  Node,
  Edge,
  Group,
  TopologyOverviewItem,
} from './topology-types';

export const allowedResources = ['deployments', 'deploymentConfigs', 'daemonSets', 'statefulSets'];

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
  operatorBackedServiceKinds: string[],
  cheURL?: string,
  type?: string,
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
  return {
    id: dcUID,
    name:
      _.get(deploymentConfig, 'metadata.name') || deploymentsLabels['app.kubernetes.io/instance'],
    type: type || 'workload',
    resources: { ...dc },
    pods: dc.pods,
    operatorBackedService: operatorBackedServiceKinds.includes(nodeResourceKind),
    data: {
      url: getRoutesUrl(dc),
      kind: referenceFor(deploymentConfig),
      editUrl:
        deploymentsAnnotations['app.openshift.io/edit-url'] ||
        getEditURL(deploymentsAnnotations['app.openshift.io/vcs-uri'], cheURL),
      cheEnabled: !!cheURL,
      builderImage:
        getImageForIconClass(`icon-${deploymentsLabels['app.openshift.io/runtime']}`) ||
        getImageForIconClass(`icon-${deploymentsLabels['app.kubernetes.io/name']}`) ||
        getImageForIconClass(`icon-openshift`),
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
    // look for multiple backing services first in `backingServiceSelectors`
    // followed by a fallback to the single reference in `backingServiceSelector`
    _.forEach(sbr.spec.backingServiceSelectors || [sbr.spec.backingServiceSelector], (bss) => {
      if (bss) {
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
            type: 'service-binding',
            source: uid,
            target: targetNode,
            data: { sbr },
          });
        }
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
export const getTopologyGroupItems = (dc: K8sResourceKind, groups: Group[]): Group[] => {
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
  const installedOperators = _.get(resources, 'clusterServiceVersion.data');
  const operatorBackedServiceKinds = [];
  const serviceBindingRequests = _.get(resources, 'serviceBindingRequests.data');

  if (installedOperators) {
    _.forEach(installedOperators, (op) => {
      _.get(op, 'spec.customresourcedefinitions.owned').map((service) =>
        operatorBackedServiceKinds.push(service.kind),
      );
    });
  }

  let topologyGraphAndNodeData: TopologyDataModel = {
    graph: { nodes: [], edges: [], groups: [] },
    topology: {},
  };

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
        operatorBackedServiceKinds,
        utils,
        cheURL,
        application,
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
  const knEventSources: K8sResourceKind[] = getKnativeEventSources();
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
        dataToShowOnNodes[uid] = createTopologyNodeData(item, operatorBackedServiceKinds, cheURL);
        if (!_.some(topologyGraphAndNodeData.graph.nodes, { id: uid })) {
          nodesData = [...nodesData, getTopologyNodeItem(deploymentConfig)];
          edgesData = [
            ...edgesData,
            ...getTopologyEdgeItems(
              deploymentConfig,
              allResources,
              serviceBindingRequests,
              application,
            ),
          ];
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
): Promise<any> => {
  if (!source || !target || source === target) {
    return Promise.reject();
  }

  const sourceObj = getTopologyResourceObject(source);
  const targetObj = getTopologyResourceObject(target);
  const replaceTargetObj = replaceTarget && getTopologyResourceObject(replaceTarget);

  if (serviceBindingFlag && target.operatorBackedService) {
    return createServiceBinding(sourceObj, targetObj);
  }

  return createResourceConnection(sourceObj, targetObj, replaceTargetObj);
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
