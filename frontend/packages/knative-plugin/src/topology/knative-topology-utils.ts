import * as _ from 'lodash';
import {
  K8sResourceKind,
  apiVersionForModel,
  referenceFor,
  modelFor,
  k8sUpdate,
  PodKind,
} from '@console/internal/module/k8s';
import {
  getResourcePausedAlert,
  getBuildAlerts,
  getOwnedResources,
  getBuildConfigsForResource,
  getReplicaSetsForResource,
  getRoutesForServices,
  getServicesForResource,
} from '@console/shared';
import { Model, EdgeModel, Node, NodeModel, NodeShape } from '@console/topology';
import {
  TopologyDataResources,
  TopologyDataObject,
  getTopologyGroupItems,
  createTopologyNodeData,
  getTopologyNodeItem,
  mergeGroup,
  filterBasedOnActiveApplication,
  getTopologyResourceObject,
  TopologyOverviewItem,
  NODE_WIDTH,
  NODE_HEIGHT,
  NODE_PADDING,
  WorkloadModelProps,
} from '@console/dev-console/src/components/topology';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { DeploymentModel } from '@console/internal/models';
import { RootState } from '@console/internal/redux';
import { FLAG_KNATIVE_EVENTING } from '../const';
import { ServiceModel as knServiceModel } from '../models';
import { KnativeItem } from '../utils/get-knative-resources';
import { Traffic as TrafficData } from '../types';
import {
  KNATIVE_GROUP_NODE_HEIGHT,
  KNATIVE_GROUP_NODE_PADDING,
  KNATIVE_GROUP_NODE_WIDTH,
} from './const';

export enum NodeType {
  EventSource = 'event-source',
  KnService = 'knative-service',
  Revision = 'knative-revision',
}

export enum EdgeType {
  Traffic = 'revision-traffic',
  EventSource = 'event-source-link',
}

type RevK8sResourceKind = K8sResourceKind & {
  resources?: { [key: string]: any };
};

export const getKnNodeModelProps = (type: string) => {
  switch (type) {
    case NodeType.EventSource:
      return {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        visible: true,
        style: {
          padding: NODE_PADDING,
        },
      };
      break;
    case NodeType.KnService:
      return {
        width: KNATIVE_GROUP_NODE_WIDTH,
        height: KNATIVE_GROUP_NODE_HEIGHT,
        visible: true,
        collapsed: false,
        group: true,
        shape: NodeShape.rect,
        style: {
          padding: KNATIVE_GROUP_NODE_PADDING,
        },
      };
      break;
    default:
      return WorkloadModelProps;
      break;
  }
};

/**
 * returns if event source is enabled or not
 * @param Flags
 */
export const getEventSourceStatus = ({ FLAGS }: RootState): boolean =>
  FLAGS.get(FLAG_KNATIVE_EVENTING);

/**
 * get knative service routes url based on the revision's traffic
 */
export const getKnativeServiceRoutesURL = (ksvc: K8sResourceKind): string => {
  if (!ksvc.status) {
    return '';
  }
  const maximumTraffic: TrafficData = _.maxBy(ksvc.status.traffic as TrafficData[], 'percent');
  return maximumTraffic?.url || ksvc.status.url;
};

/**
 * fetch the parent resource from a resource
 * @param resource
 * @param resources
 */
export const getParentResource = (
  resource: K8sResourceKind,
  resources: K8sResourceKind[],
): K8sResourceKind => {
  const parentUids = _.map(
    _.get(resource, ['metadata', 'ownerReferences'], []),
    (owner) => owner.uid,
  );
  const [resourcesParent] = _.filter(resources, ({ metadata: { uid } }) =>
    parentUids.includes(uid),
  );
  return resourcesParent;
};

/**
 * Filters revision based on active application
 * @param revisions
 * @param resources
 * @param application
 */
export const filterRevisionsByActiveApplication = (
  revisions: K8sResourceKind[],
  resources: TopologyDataResources,
  application: string,
) => {
  const filteredRevisions = [];
  _.forEach(revisions, (revision) => {
    const configuration = getParentResource(revision, resources.configurations.data);
    const service = getParentResource(configuration, resources.ksservices.data);
    const hasTraffic =
      service &&
      service.status &&
      _.find(service.status.traffic, { revisionName: revision.metadata.name });
    const isServicePartofGroup = filterBasedOnActiveApplication([service], application).length > 0;
    if (hasTraffic && isServicePartofGroup) {
      filteredRevisions.push(revision);
    }
  });
  return filteredRevisions;
};

/**
 * Forms data with respective revisions, configurations, routes based on kntaive service
 */
export const getKnativeServiceData = (
  resource: K8sResourceKind,
  resources: TopologyDataResources,
  utils?: KnativeUtil[],
): KnativeItem => {
  const configurations = getOwnedResources(resource, resources.configurations.data);
  const revisions =
    configurations && configurations.length
      ? getOwnedResources(configurations[0], resources.revisions.data)
      : undefined;
  const revisionsDeploymentData = _.reduce(
    revisions,
    (acc, revision) => {
      let revisionDep: RevK8sResourceKind = revision;
      let pods: PodKind[];
      if (resources.deployments) {
        const associatedDeployment = getOwnedResources(revision, resources.deployments.data);
        if (!_.isEmpty(associatedDeployment)) {
          const depObj: K8sResourceKind = {
            ...associatedDeployment[0],
            apiVersion: apiVersionForModel(DeploymentModel),
            kind: DeploymentModel.kind,
          };
          const replicaSets = getReplicaSetsForResource(depObj, resources);
          const [current, previous] = replicaSets;
          pods = [..._.get(current, 'pods', []), ..._.get(previous, 'pods', [])];
          revisionDep = { ...revisionDep, resources: { pods, current } };
        }
      }
      acc.revisionsDep.push(revisionDep);
      pods && acc.allPods.push(...pods);
      return acc;
    },
    { revisionsDep: [], allPods: [] },
  );
  const ksroutes = resources.ksroutes
    ? getOwnedResources(resource, resources.ksroutes.data)
    : undefined;
  const buildConfigs = getBuildConfigsForResource(resource, resources);
  const overviewItem = {
    configurations,
    revisions: revisionsDeploymentData.revisionsDep,
    ksroutes,
    buildConfigs,
    pods: revisionsDeploymentData.allPods,
  };
  if (utils) {
    return utils.reduce((acc, util) => {
      return { ...acc, ...util(resource, resources) };
    }, overviewItem);
  }
  return overviewItem;
};

export type KnativeUtil = (dc: K8sResourceKind, props) => KnativeItem | undefined;
/**
 * Rollup data for deployments for revisions/ event sources
 */
const createKnativeDeploymentItems = (
  resource: K8sResourceKind,
  resources: TopologyDataResources,
  utils?: KnativeUtil[],
): TopologyOverviewItem => {
  const associatedDeployment = getOwnedResources(resource, resources.deployments.data);
  if (!_.isEmpty(associatedDeployment)) {
    const depObj: K8sResourceKind = {
      ...associatedDeployment[0],
      apiVersion: apiVersionForModel(DeploymentModel),
      kind: DeploymentModel.kind,
    };
    const replicaSets = getReplicaSetsForResource(depObj, resources);
    const [current, previous] = replicaSets;
    const isRollingOut = !!current && !!previous;
    const buildConfigs = getBuildConfigsForResource(depObj, resources);
    const services = getServicesForResource(depObj, resources);
    const routes = getRoutesForServices(services, resources);
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
      associatedDeployment: depObj,
    };

    if (utils) {
      return utils.reduce((acc, util) => {
        return { ...acc, ...util(resource, resources) };
      }, overviewItems);
    }

    return overviewItems;
  }
  const knResources = getKnativeServiceData(resource, resources, utils);
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
  if (!_.get(resource, 'status.traffic', null)) return undefined;
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
  data: TopologyDataObject,
  resources?: TopologyDataResources,
): NodeModel[] => {
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
      nodes.push(
        getTopologyNodeItem(c, NodeType.Revision, null, getKnNodeModelProps(NodeType.Revision)),
      );
    });
  }
  nodes.push(getTopologyNodeItem(resource, type, data, getKnNodeModelProps(type), children));
  return nodes;
};

/**
 * Form Edge data for event sources
 */
export const getEventTopologyEdgeItems = (resource: K8sResourceKind, { data }): EdgeModel[] => {
  const uid = _.get(resource, ['metadata', 'uid']);
  const sinkSvc = _.get(resource, 'spec.sink.ref', null) || _.get(resource, 'spec.sink', null);
  const edges = [];
  if (sinkSvc && sinkSvc.kind === knServiceModel.kind) {
    _.forEach(data, (res) => {
      const resname = _.get(res, ['metadata', 'name']);
      const resUid = _.get(res, ['metadata', 'uid']);
      if (resname === sinkSvc.name) {
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
export const getTrafficTopologyEdgeItems = (resource: K8sResourceKind, { data }): EdgeModel[] => {
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
      const revisionIndex = _.findIndex(edges, (edge) => edge.id === `${uid}_${resUid}`);
      if (revisionIndex >= 0) {
        edges[revisionIndex].data.percent += trafficPercent;
      } else {
        edges.push({
          id: `${uid}_${resUid}`,
          type: EdgeType.Traffic,
          source: uid,
          target: resUid,
          data: { percent: trafficPercent },
        });
      }
    }
  });
  return edges;
};

/**
 * create all data that need to be shown on a topology data for knative service
 */
export const createTopologyServiceNodeData = (
  svcRes: TopologyOverviewItem,
  type: string,
): TopologyDataObject => {
  const { pipelines = [], pipelineRuns = [] } = svcRes;
  const { obj: knativeSvc } = svcRes;
  const uid = _.get(knativeSvc, 'metadata.uid');
  const labels = _.get(knativeSvc, 'metadata.labels', {});
  const annotations = _.get(knativeSvc, 'metadata.annotations', {});
  return {
    id: uid,
    name: _.get(knativeSvc, 'metadata.name') || labels['app.kubernetes.io/instance'],
    type,
    resources: { ...svcRes },
    data: {
      url: getKnativeServiceRoutesURL(knativeSvc),
      kind: referenceFor(knativeSvc),
      editURL: annotations['app.openshift.io/edit-url'],
      vcsURI: annotations['app.openshift.io/vcs-uri'],
      isKnativeResource: true,
      connectedPipeline: {
        pipeline: pipelines[0],
        pipelineRuns,
      },
      build: svcRes.buildConfigs?.[0]?.builds?.[0],
    },
  };
};

export const transformKnNodeData = (
  knResourcesData: K8sResourceKind[],
  type: string,
  resources: TopologyDataResources,
  utils?: KnativeUtil[],
): Model => {
  const knDataModel: Model = { nodes: [], edges: [] };

  _.forEach(knResourcesData, (res) => {
    const item = createKnativeDeploymentItems(res, resources, utils);
    switch (type) {
      case NodeType.EventSource: {
        const data = createTopologyNodeData(item, type, getImageForIconClass(`icon-openshift`));
        knDataModel.nodes.push(...getKnativeTopologyNodeItems(res, type, data, resources));
        knDataModel.edges.push(...getEventTopologyEdgeItems(res, resources.ksservices));
        const newGroup = getTopologyGroupItems(res);
        mergeGroup(newGroup, knDataModel.nodes);
        break;
      }
      case NodeType.KnService: {
        const data = createTopologyServiceNodeData(item, type);
        knDataModel.nodes.push(...getKnativeTopologyNodeItems(res, type, data, resources));
        knDataModel.edges.push(...getTrafficTopologyEdgeItems(res, resources.revisions));
        const newGroup = getTopologyGroupItems(res);
        mergeGroup(newGroup, knDataModel.nodes);
        break;
      }
      default:
        break;
    }
  });

  return knDataModel;
};

export interface RevisionDataMap {
  [id: string]: TopologyDataObject;
}

export const getRevisionsData = (
  knResourcesData: K8sResourceKind[],
  resources: TopologyDataResources,
  utils?: KnativeUtil[],
): RevisionDataMap => {
  const revisionData = {};

  _.forEach(knResourcesData, (res) => {
    const { uid } = res.metadata;
    const item = createKnativeDeploymentItems(res, resources, utils);
    const revisionItem = _.omit(item, ['pipelines', 'pipelineRuns', 'buildConfigs']);
    revisionData[uid] = createTopologyNodeData(
      revisionItem,
      NodeType.Revision,
      getImageForIconClass(`icon-openshift`),
    );
  });

  return revisionData;
};

export const createKnativeEventSourceSink = (
  source: K8sResourceKind,
  target: K8sResourceKind,
): Promise<K8sResourceKind> => {
  if (!source || !target || source === target) {
    return Promise.reject();
  }
  const targetName = _.get(target, 'metadata.name');
  const eventSourceObj = _.omit(source, 'status');
  const sink = {
    ref: {
      apiVersion: target.apiVersion,
      kind: target.kind,
      name: targetName,
    },
  };
  const updatePayload = {
    ...eventSourceObj,
    spec: { ...eventSourceObj.spec, sink },
  };
  return k8sUpdate(modelFor(referenceFor(source)), updatePayload);
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

export const createSinkConnection = (
  sourceNode: Node,
  targetNode: Node,
): Promise<K8sResourceKind> => {
  return createTopologySinkConnection(sourceNode.getData(), targetNode.getData());
};
