import * as _ from 'lodash';
import { K8sResourceKind, apiVersionForModel, DeploymentKind } from '@console/internal/module/k8s';
import {
  TransformResourceData,
  getResourcePausedAlert,
  getBuildAlerts,
  getOwnedResources,
  OverviewItem,
} from '@console/shared';
import {
  Node,
  Edge,
  TopologyDataResources,
  TopologyDataModel,
  TopologyDataObject,
} from '@console/dev-console/src/components/topology/topology-types';
import {
  getTopologyGroupItems,
  createTopologyNodeData,
  getRoutesUrl,
  getEditURL,
  getTopologyNodeItem,
} from '@console/dev-console/src/components/topology/topology-utils';
import { DeploymentModel } from '@console/internal/models';
import { KnativeItem } from './get-knative-resources';

export enum NodeType {
  EventSource = 'event-source',
  KnService = 'knative-service',
  Revision = 'knative-revision',
}

export enum EdgeType {
  Traffic = 'revision-traffic',
  EventSource = 'event-source-link',
}

/**
 * Forms data with respective revisions, configurations, routes based on kntaive service
 */
export const getKnativeServiceData = (
  resource: K8sResourceKind,
  resources: TopologyDataResources,
): KnativeItem => {
  const configurations = getOwnedResources(resource, resources.configurations.data);
  const revisions =
    configurations && configurations.length
      ? getOwnedResources(configurations[0], resources.revisions.data)
      : undefined;
  const ksroutes = resources.ksroutes
    ? getOwnedResources(resource, resources.ksroutes.data)
    : undefined;
  const knativedata = { configurations, revisions, ksroutes };
  return knativedata;
};

/**
 * Rollup data for deployments for revisions/ event sources
 */
const createKnativeDeploymentItems = (
  resource: K8sResourceKind,
  resources: TopologyDataResources,
  utils?: Function[],
): OverviewItem => {
  const transformResourceData = new TransformResourceData(resources, utils);
  const associatedDeployment = getOwnedResources(resource, resources.deployments.data);
  if (!_.isEmpty(associatedDeployment)) {
    const depObj: K8sResourceKind = {
      ...associatedDeployment[0],
      apiVersion: apiVersionForModel(DeploymentModel),
      kind: DeploymentModel.kind,
    };
    const replicaSets = transformResourceData.getReplicaSetsForResource(depObj);
    const [current, previous] = replicaSets;
    const isRollingOut = !!current && !!previous;
    const buildConfigs = transformResourceData.getBuildConfigsForResource(depObj);
    const services = transformResourceData.getServicesForResource(depObj);
    const routes = transformResourceData.getRoutesForServices(services);
    const alerts = {
      ...getResourcePausedAlert(depObj),
      ...getBuildAlerts(buildConfigs),
    };
    const overviewItems = {
      obj: resource,
      alerts,
      buildConfigs,
      current,
      isRollingOut,
      previous,
      pods: [..._.get(current, 'pods', []), ..._.get(previous, 'pods', [])],
      routes,
      services,
    };

    if (utils) {
      return utils.reduce((acc, element) => {
        return { ...acc, ...element(depObj, resources) };
      }, overviewItems);
    }
    return overviewItems;
  }
  const knResources = getKnativeServiceData(resource, resources);
  return {
    obj: resource,
    buildConfigs: [],
    routes: [],
    services: [],
    ...knResources,
  };
};

/**
 * only get revision which are included in traffic data
 */
export const filterRevisionsBaseOnTrafficStatus = (
  resource: K8sResourceKind,
  revisions: K8sResourceKind[],
): K8sResourceKind[] => {
  if (!revisions || !resource.status.traffic) return undefined;
  return resource.status.traffic.reduce((acc, curr) => {
    const el = revisions.find((rev) => curr.revisionName === rev.metadata.name);
    return el ? [...acc, el] : acc;
  }, []);
};

/**
 * Form Node data for revisions/event/service sources
 */
export const getKnativeTopologyNodeItems = (
  resource: K8sResourceKind,
  type: string,
  resources?: TopologyDataResources,
): Node[] => {
  const nodes = [];
  const children: string[] = [];
  if (type === NodeType.KnService && resources && resources.configurations) {
    const configurations = getOwnedResources(resource, resources.configurations.data);
    const configUidData = _.get(configurations[0], ['metadata', 'uid']);
    const ChildData = _.filter(resources.revisions.data, {
      metadata: {
        ownerReferences: [{ uid: configUidData }],
      },
    });
    _.forEach(filterRevisionsBaseOnTrafficStatus(resource, ChildData), (c) => {
      const uidRev = c.metadata.uid;
      children.push(uidRev);
      nodes.push(getTopologyNodeItem(c, NodeType.Revision));
    });
  }
  nodes.push(getTopologyNodeItem(resource, type, children));
  return nodes;
};

/**
 * Form Edge data for event sources
 */
export const getEventTopologyEdgeItems = (
  resource: K8sResourceKind,
  { data },
  application?: string,
): Edge[] => {
  const uid = _.get(resource, ['metadata', 'uid']);
  const sinkSvc = _.get(resource, ['spec', 'sink'], {});
  const edges = [];
  if (sinkSvc.kind === 'Service') {
    _.forEach(data, (res) => {
      const PART_OF = 'app.kubernetes.io/part-of';
      const resname = _.get(res, ['metadata', 'name']);
      const resUid = _.get(res, ['metadata', 'uid']);
      const appGroup = _.get(res, ['metadata', 'labels', PART_OF], null);
      if (resname === sinkSvc.name && (!application || appGroup === application)) {
        edges.push({
          id: `${uid}_${resUid}`,
          type: EdgeType.EventSource,
          source: uid,
          target: resUid,
        });
      }
    });
  }
  return edges;
};

/**
 * Form Edge data for service sources with traffic data
 */
export const getTrafficTopologyEdgeItems = (resource: K8sResourceKind, { data }): Edge[] => {
  const uid = _.get(resource, ['metadata', 'uid']);
  const trafficSvc = _.get(resource, ['status', 'traffic'], []);
  const edges = [];
  _.forEach(trafficSvc, (res) => {
    const resname = _.get(res, ['revisionName']);
    const trafficPercent = _.get(res, ['percent']);
    const revisionObj = _.find(data, (rev) => {
      const revname = _.get(rev, ['metadata', 'name']);
      return revname === resname;
    });
    const resUid = _.get(revisionObj, ['metadata', 'uid'], null);
    if (resUid) {
      edges.push({
        id: `${uid}_${resUid}`,
        type: EdgeType.Traffic,
        source: uid,
        target: resUid,
        data: { percent: trafficPercent },
      });
    }
  });
  return edges;
};

/**
 * create all data that need to be shown on a topology data for knative service
 */
export const createTopologyServiceNodeData = (
  svcRes: OverviewItem,
  operatorBackedServiceKinds: string[],
  type: string,
  cheURL?: string,
): TopologyDataObject => {
  const { obj: knativeSvc } = svcRes;
  const uid = _.get(knativeSvc, 'metadata.uid');
  const labels = _.get(knativeSvc, 'metadata.labels', {});
  const annotations = _.get(knativeSvc, 'metadata.annotations', {});
  const nodeResourceKind = _.get(knativeSvc, 'metadata.ownerReferences[0].kind');
  return {
    id: uid,
    name: _.get(knativeSvc, 'metadata.name') || labels['app.kubernetes.io/instance'],
    type,
    resources: { ...svcRes },
    operatorBackedService: operatorBackedServiceKinds.includes(nodeResourceKind),
    data: {
      url: getRoutesUrl(svcRes.routes, _.get(svcRes, ['ksroutes'])),
      kind: knativeSvc.kind,
      editUrl:
        annotations['app.openshift.io/edit-url'] ||
        getEditURL(annotations['app.openshift.io/vcs-uri'], cheURL),
      isKnativeResource: true,
    },
  };
};

export const tranformKnNodeData = (
  knResourcesData: K8sResourceKind[],
  type: string,
  topologyGraphAndNodeData: TopologyDataModel,
  resources: TopologyDataResources,
  operatorBackedServiceKinds: string[],
  utils?: Function[],
  cheURL?: string,
  application?: string,
) => {
  let nodesData = [];
  let edgesData = [];
  let groupsData = [];
  const dataToShowOnNodes = {};
  _.forEach(knResourcesData, (res) => {
    const { uid } = res.metadata;
    if (
      !_.some(topologyGraphAndNodeData.graph.nodes, { id: uid }) ||
      !topologyGraphAndNodeData.topology[uid]
    ) {
      const item = createKnativeDeploymentItems(res, resources, utils);
      switch (type) {
        case NodeType.EventSource: {
          dataToShowOnNodes[uid] = createTopologyNodeData(
            item,
            operatorBackedServiceKinds,
            cheURL,
            type,
          );
          nodesData = [...nodesData, ...getKnativeTopologyNodeItems(res, type, resources)];
          edgesData = [
            ...edgesData,
            ...getEventTopologyEdgeItems(res, resources.ksservices, application),
          ];
          groupsData = [...getTopologyGroupItems(res, topologyGraphAndNodeData.graph.groups)];
          break;
        }
        case NodeType.Revision: {
          dataToShowOnNodes[uid] = createTopologyNodeData(
            item,
            operatorBackedServiceKinds,
            cheURL,
            type,
          );
          groupsData = [...topologyGraphAndNodeData.graph.groups];
          break;
        }
        case NodeType.KnService: {
          dataToShowOnNodes[uid] = createTopologyServiceNodeData(
            item,
            operatorBackedServiceKinds,
            type,
            cheURL,
          );
          nodesData = [...nodesData, ...getKnativeTopologyNodeItems(res, type, resources)];
          edgesData = [...edgesData, ...getTrafficTopologyEdgeItems(res, resources.revisions)];
          groupsData = [...getTopologyGroupItems(res, topologyGraphAndNodeData.graph.groups)];
          break;
        }
        default:
          break;
      }
    }
  });

  return { nodesData, edgesData, dataToShowOnNodes, groupsData };
};

/**
 * Filter out deployments not created via revisions/eventsources
 */
export const filterNonKnativeDeployments = (resources: DeploymentKind[]): DeploymentKind[] => {
  const KNATIVE_CONFIGURATION = 'serving.knative.dev/configuration';
  const KNATIVE_EVENTS_CRONJOB = 'sources.eventing.knative.dev/cronJobSource';
  const KNATIVE_EVENTS_CONTAINER = 'sources.eventing.knative.dev/containerSource';
  const KNATIVE_EVENTS_APISERVER = 'sources.eventing.knative.dev/apiServerSource';
  const KNATIVE_EVENTS_CAMEL = 'sources.eventing.knative.dev/camelSource';
  const KNATIVE_EVENTS_KAFKA = 'sources.eventing.knative.dev/kafkaSource';
  return _.filter(resources, (d) => {
    return (
      !_.get(d, ['metadata', 'labels', KNATIVE_CONFIGURATION]) &&
      !_.get(d, ['metadata', 'labels', KNATIVE_EVENTS_CRONJOB]) &&
      !_.get(d, ['metadata', 'labels', KNATIVE_EVENTS_CONTAINER]) &&
      !_.get(d, ['metadata', 'labels', KNATIVE_EVENTS_APISERVER]) &&
      !_.get(d, ['metadata', 'labels', KNATIVE_EVENTS_CAMEL]) &&
      !_.get(d, ['metadata', 'labels', KNATIVE_EVENTS_KAFKA])
    );
  });
};
