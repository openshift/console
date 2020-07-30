import * as _ from 'lodash';
import {
  K8sResourceKind,
  apiVersionForModel,
  referenceFor,
  modelFor,
  k8sUpdate,
  PodKind,
  kindForReference,
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
import { Edge, EdgeModel, Model, Node, NodeModel, NodeShape } from '@patternfly/react-topology';
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
  getResource,
} from '@console/dev-console/src/components/topology';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { DeploymentModel, PodModel } from '@console/internal/models';
import { RootState } from '@console/internal/redux';
import { FLAG_KNATIVE_EVENTING, CAMEL_SOURCE_INTEGRATION } from '../const';
import { KnativeItem } from '../utils/get-knative-resources';
import {
  KNATIVE_GROUP_NODE_HEIGHT,
  KNATIVE_GROUP_NODE_PADDING,
  KNATIVE_GROUP_NODE_WIDTH,
} from './const';
import {
  getDynamicEventSourcesModelRefs,
  getDynamicChannelModelRefs,
} from '../utils/fetch-dynamic-eventsources-utils';
import { EventingBrokerModel, EventSourceCamelModel, EventingTriggerModel } from '../models';
import {
  NodeType,
  Subscriber,
  RevK8sResourceKind,
  EdgeType,
  PubsubNodes,
  KnativeUtil,
} from './topology-types';

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
    case NodeType.PubSub:
      return {
        width: NODE_WIDTH,
        height: NODE_HEIGHT / 2,
        visible: true,
        shape: NodeShape.rect,
        style: {
          padding: NODE_PADDING,
        },
      };
    case NodeType.SinkUri:
      return {
        width: NODE_WIDTH * 0.75,
        height: NODE_HEIGHT * 0.75,
        visible: true,
        shape: NodeShape.circle,
        style: {
          padding: NODE_PADDING,
        },
      };
    default:
      return WorkloadModelProps;
  }
};

/**
 * returns if event source is enabled or not
 * @param Flags
 */
export const getEventSourceStatus = ({ FLAGS }: RootState): boolean =>
  FLAGS.get(FLAG_KNATIVE_EVENTING);

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
export const isInternalResource = (resource: K8sResourceKind): boolean => {
  if (resource.kind !== EventingBrokerModel.kind && resource.metadata?.ownerReferences) {
    return true;
  }
  return false;
};

const isSubscriber = (resource: K8sResourceKind, relatedResource: K8sResourceKind): boolean => {
  const subscriberRef = relatedResource?.spec?.subscriber?.ref;
  return (
    subscriberRef &&
    referenceFor(resource) === referenceFor(subscriberRef) &&
    resource.metadata.name === subscriberRef.name
  );
};

const isPublisher = (
  relatedResource: K8sResourceKind,
  relationshipResource: K8sResourceKind,
  mainResource: K8sResourceKind,
): boolean => {
  const { name, kind, apiVersion } = relationshipResource.spec?.subscriber?.ref || {};
  if (
    mainResource.metadata.name !== name ||
    mainResource.kind !== kind ||
    mainResource.apiVersion !== apiVersion
  ) {
    return false;
  }
  if (relationshipResource.kind === EventingTriggerModel.kind) {
    return relationshipResource.spec?.broker === relatedResource.metadata.name;
  }
  const channel = relationshipResource.spec?.channel;
  return channel && channel.name === relatedResource.metadata.name;
};

export const getTriggerFilters = (resource: K8sResourceKind) => {
  const data = {
    filters: [],
  };
  const attributes = resource?.spec?.filter?.attributes;
  if (attributes && !_.isEmpty(attributes)) {
    for (const [key, value] of Object.entries(attributes)) {
      data.filters.push({ key, value });
    }
  }
  return data;
};

export const getKnativeDynamicResources = (
  resources: TopologyDataResources,
  dynamicProps: string[],
): K8sResourceKind[] => {
  return dynamicProps.reduce((acc, currProp) => {
    const currPropResource = resources[currProp]?.data ?? [];
    return [...acc, ...currPropResource];
  }, []);
};

export const getSubscribedEventsources = (
  pubSubResource: K8sResourceKind,
  resources: TopologyDataResources,
) => {
  const eventSourceProps = getDynamicEventSourcesModelRefs();
  return _.reduce(
    getKnativeDynamicResources(resources, eventSourceProps),
    (acc, evSrc) => {
      const sinkRes = evSrc?.spec?.sink?.ref || {};
      if (pubSubResource.kind === sinkRes.kind && pubSubResource.metadata.name === sinkRes.name) {
        acc.push(evSrc);
      }
      return acc;
    },
    [],
  );
};

/**
 * Get the subscribers for broker, channels and knative service
 * @param resource
 * @param resources
 */
export const getPubSubSubscribers = (
  resource: K8sResourceKind,
  resources: TopologyDataResources,
): Subscriber[] | [] => {
  const channelResourceProps = getDynamicChannelModelRefs();

  const relationShipMap = {
    Broker: [
      {
        relatedResource: 'ksservices',
        relationshipResource: 'triggers',
        isRelatedResource: isSubscriber,
      },
    ],
    Service: [
      {
        relatedResource: 'brokers',
        relationshipResource: 'triggers',
        isRelatedResource: isPublisher,
      },
    ],
  };
  _.forEach(channelResourceProps, (channel) => {
    relationShipMap.Service.push({
      relatedResource: channel,
      relationshipResource: 'eventingsubscription',
      isRelatedResource: isPublisher,
    });
    relationShipMap[channel] = [
      {
        relatedResource: 'ksservices',
        relationshipResource: 'eventingsubscription',
        isRelatedResource: isSubscriber,
      },
    ];
  });

  let subscribers = [];
  if (relationShipMap[resource.kind] || relationShipMap[referenceFor(resource)]) {
    const depicters = relationShipMap[resource.kind] || relationShipMap[referenceFor(resource)];
    _.forEach(depicters, (depicter) => {
      const { relatedResource, relationshipResource, isRelatedResource } = depicter;
      if (resources[relatedResource] && resources[relatedResource].data.length > 0) {
        subscribers = subscribers.concat(
          _.reduce(
            resources[relatedResource].data,
            (acc, relRes) => {
              if (isInternalResource(relRes) || !isRelatedResource) {
                return acc;
              }
              const relationshipResources = (resources[relationshipResource].data || []).filter(
                (relationshipRes) => {
                  return isRelatedResource(relRes, relationshipRes, resource);
                },
              );
              const relationShipData = relationshipResources.map((res) => {
                return {
                  kind: referenceFor(res),
                  name: res.metadata.name,
                  namespace: res.metadata.namespace,
                  ...getTriggerFilters(res),
                };
              });
              if (relationShipData.length > 0) {
                const obj = {
                  kind: referenceFor(relRes),
                  name: relRes.metadata.name,
                  namespace: relRes.metadata.namespace,
                  data: relationShipData,
                };
                acc.push(obj);
              }
              return acc;
            },
            [],
          ),
        );
      }
    });
  }
  return subscribers;
};
/**
 * partition and return the array of channels and brokers
 * @param subscribers
 */
export const getSubscriberByType = (
  subscribers: Subscriber[] = [],
): [Subscriber[], Subscriber[]] => {
  if (subscribers.length === 0) {
    return [[], []];
  }
  const channelResourceProps = getDynamicChannelModelRefs();
  return _.partition(subscribers, (sub) => channelResourceProps.includes(sub.kind));
};
/**
 * return the dyanmic channel reference
 * @param name
 * @param kind
 */
const getChannelRef = (kind: string): string => {
  const channelResourceProps = getDynamicChannelModelRefs();
  return _.find(channelResourceProps, (channel) => {
    return kind === kindForReference(channel);
  });
};

/**
 * Get the knative service subscriptions
 * @param ksvc Knative Service
 * @param resources
 */
export const getSubscribedPubSubNodes = (
  ksvc: K8sResourceKind,
  resources: TopologyDataResources,
) => {
  const pubsubConnectors = ['triggers', 'eventingsubscription'];
  const pubsubNodes: PubsubNodes = { channels: [], brokers: [] };
  pubsubConnectors.forEach((connector: string) => {
    if (resources[connector] && resources[connector].data.length > 0) {
      const pubsubConnectorResources = resources[connector].data;
      _.map(pubsubConnectorResources, (connectorRes) => {
        if (!isInternalResource(connectorRes)) {
          const subscriber = connectorRes.spec?.subscriber?.ref;
          if (subscriber) {
            const subscribedService =
              ksvc.kind === subscriber.kind && ksvc.metadata.name === subscriber.name;
            if (subscribedService && connectorRes.kind === EventingTriggerModel.kind) {
              const broker = connectorRes.spec?.broker;
              if (!pubsubNodes.brokers.includes(broker)) {
                pubsubNodes.brokers.push(broker);
              }
            } else if (subscribedService) {
              const channel = connectorRes.spec?.channel;
              const { apiVersion, name, kind } = channel || {};

              const channelAdded = _.find(pubsubNodes.channels, {
                apiVersion,
                name,
                kind,
              });
              if (channel && !channelAdded) {
                pubsubNodes.channels.push(channel);
              }
            }
          }
        }
      });
    }
  });
  const eventSources = [];
  const pushEventSource = (evsrc: K8sResourceKind) => {
    const evsrcFound = _.find(eventSources, {
      kind: evsrc.kind,
      metadata: { name: evsrc.metadata.name },
    });
    if (!evsrcFound) {
      eventSources.push(evsrc);
    }
  };
  pubsubNodes.brokers.forEach((broker) => {
    const eventBroker = _.find(resources.brokers.data, {
      metadata: { name: broker },
    });
    const evsrcs = eventBroker ? getSubscribedEventsources(eventBroker, resources) : [];
    evsrcs.forEach((evsrc) => {
      pushEventSource(evsrc);
    });
  });
  pubsubNodes.channels.forEach((channel) => {
    const channelKind = getChannelRef(channel.kind);
    const channelResources = resources[channelKind];
    if (channelResources) {
      const eventingChannel = _.find(channelResources.data, {
        metadata: { name: channel.name },
        kind: channel.kind,
      });
      const evsrcs = eventingChannel ? getSubscribedEventsources(eventingChannel, resources) : [];
      evsrcs.forEach((evsrc) => {
        pushEventSource(evsrc);
      });
    }
  });

  getSubscribedEventsources(ksvc, resources).forEach((evsrc) => {
    pushEventSource(evsrc);
  });
  return eventSources;
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
  const eventSources = getSubscribedPubSubNodes(resource, resources);
  const subscribers = getPubSubSubscribers(resource, resources);
  const overviewItem = {
    configurations,
    revisions: revisionsDeploymentData.revisionsDep,
    ksroutes,
    buildConfigs,
    eventSources,
    subscribers,
    pods: revisionsDeploymentData.allPods,
  };
  if (utils) {
    return utils.reduce((acc, util) => {
      return { ...acc, ...util(resource, resources) };
    }, overviewItem);
  }
  return overviewItem;
};

/**
 * Rollup data for deployments for revisions/ event sources
 */
const createKnativeDeploymentItems = (
  resource: K8sResourceKind,
  resources: TopologyDataResources,
  utils?: KnativeUtil[],
): TopologyOverviewItem => {
  let associatedDeployment = getOwnedResources(resource, resources.deployments.data);
  // form Deployments for camelSource as they are owned by integrations
  if (resource.kind === EventSourceCamelModel.kind && resources.integrations) {
    const intgrationsOwnData = getOwnedResources(resource, resources.integrations.data);
    const integrationsOwnedDeployment =
      intgrationsOwnData?.length > 0
        ? getOwnedResources(intgrationsOwnData[0], resources.deployments.data)
        : [];
    associatedDeployment = [...associatedDeployment, ...integrationsOwnedDeployment];
  }
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

export const createPubSubDataItems = (
  resource: K8sResourceKind,
  resources: TopologyDataResources,
) => {
  const {
    kind: resKind,
    metadata: { name },
    spec,
  } = resource;
  const subscriptionData = resources?.eventingsubscription?.data ?? [];
  const triggerList = resources?.triggers?.data ?? [];
  let triggersData = {};
  const eventSources = getSubscribedEventsources(resource, resources);
  const channelSubsData = _.reduce(
    subscriptionData,
    (acc, subs) => {
      const subUid = _.get(subs, 'metadata.uid');
      const subscribers = spec?.subscribable?.subscribers || spec?.subscribers;
      const isSubscribableData = _.findIndex(subscribers, function({ uid }) {
        return uid === subUid;
      });
      if (isSubscribableData !== -1) {
        acc.eventingsubscription.push(subs);
        const subscriptionSvc = _.get(subs, 'spec.subscriber.ref', null);
        _.forEach(resources?.ksservices?.data, (svc) => {
          if (svc.kind === subscriptionSvc?.kind && svc.metadata.name === subscriptionSvc?.name) {
            acc.ksservices.push(svc);
          }
        });
      }
      return acc;
    },
    { eventingsubscription: [], ksservices: [] },
  );

  if (resKind === EventingBrokerModel.kind) {
    triggersData = _.reduce(
      triggerList,
      (tData, trigger) => {
        const brokerName = trigger?.spec?.broker;
        const knService = _.find(resources?.ksservices?.data, {
          metadata: { name: trigger?.spec?.subscriber?.ref?.name },
          kind: trigger?.spec?.subscriber?.ref?.kind,
        });
        const knServiceAdded =
          tData.ksservices.filter((ksvc) => ksvc.metadata.name === knService.metadata.name).length >
          0;
        if (name === brokerName) {
          tData.triggers = [...tData.triggers, trigger];
          tData.ksservices =
            knService && !knServiceAdded ? [...tData.ksservices, knService] : tData.ksservices;
        }

        return tData;
      },
      { ksservices: [], triggers: [], pods: [], deployments: [] },
    );
    [PodModel, DeploymentModel].forEach(({ kind, plural: resType }) => {
      triggersData[resType] = resources?.[resType]?.data
        .filter((resourceObject) => {
          return resourceObject?.metadata?.labels?.['eventing.knative.dev/broker'] === name;
        })
        .map((obj) => ({ ...obj, ...{ kind } }));
    });
  }

  return {
    obj: resource,
    buildConfigs: [],
    routes: [],
    services: [],
    eventSources,
    ...channelSubsData,
    ...triggersData,
    subscribers: getPubSubSubscribers(resource, resources),
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

export const getSinkUriTopologyNodeItems = (
  type: string,
  id: string,
  data: TopologyDataObject,
): NodeModel[] => {
  const nodes = [];
  const nodeProps = getKnNodeModelProps(type);
  nodes.push({
    id,
    type,
    resource: data.resource,
    data,
    ...(nodeProps || {}),
  });
  return nodes;
};

export const getSinkUriTopologyEdgeItems = (
  resource: K8sResourceKind,
  targetUid: string,
): EdgeModel[] => {
  const uid = resource?.metadata?.uid;
  const sinkUri = resource?.spec?.sink?.uri;
  const edges = [];
  if (sinkUri && uid) {
    edges.push({
      id: `${uid}_${targetUid}`,
      type: EdgeType.EventSource,
      source: uid,
      target: targetUid,
    });
  }
  return edges;
};

const getSinkTargetUid = (nodeData: NodeModel[], sinkUri: string) => {
  const sinkNodeData = _.find(nodeData, ({ data: nodeResData }) => {
    return sinkUri === nodeResData?.data?.sinkUri;
  });

  return sinkNodeData?.id ?? '';
};

const getEventSourcesData = (sinkUri: string, resources) => {
  const eventSourceProps = getDynamicEventSourcesModelRefs();
  const eventSources = _.reduce(
    getKnativeDynamicResources(resources, eventSourceProps),
    (acc, evSrc) => {
      const evSrcSinkUri = evSrc.spec?.sink?.uri || '';
      if (sinkUri === evSrcSinkUri) {
        acc.push(evSrc);
      }
      return acc;
    },
    [],
  );
  return eventSources;
};

/**
 * Form Edge data for event sources
 */
export const getEventTopologyEdgeItems = (resource: K8sResourceKind, { data }): EdgeModel[] => {
  const uid = resource?.metadata?.uid;
  const sinkTarget = _.get(resource, 'spec.sink.ref', null) || _.get(resource, 'spec.sink', null);
  const edges = [];
  if (sinkTarget) {
    _.forEach(data, (res) => {
      const {
        metadata: { uid: resUid, name: resName },
      } = res;
      if (resName === sinkTarget.name) {
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
 * To fetch the trigger and form the edges in the topology data model.
 * @param broker pass the eventing broker object
 * @param resources pass all the resources
 */
export const getTriggerTopologyEdgeItems = (broker: K8sResourceKind, resources): EdgeModel[] => {
  const {
    metadata: { uid, name },
  } = broker;
  const { triggers, ksservices } = resources;
  const edges = [];
  _.forEach(triggers?.data, (trigger) => {
    const brokerName = trigger?.spec?.broker;
    const connectedService = trigger.spec?.subscriber?.ref?.name;
    if (name === brokerName && ksservices) {
      const knativeService = _.find(ksservices.data as K8sResourceKind[], {
        metadata: { name: connectedService },
      });
      if (knativeService) {
        const {
          metadata: { uid: serviceUid },
        } = knativeService;
        edges.push({
          id: `${uid}_${serviceUid}`,
          type: EdgeType.EventPubSubLink,
          source: uid,
          target: serviceUid,
          data: {
            resources: {
              obj: trigger,
              eventSources: getSubscribedEventsources(broker, resources),
              brokers: [broker],
              ksservices: [knativeService],
              filters: getTriggerFilters(trigger).filters,
            },
          },
        });
      }
    }
  });
  return edges;
};

export const getSubscriptionTopologyEdgeItems = (
  resource: K8sResourceKind,
  resources,
): EdgeModel[] => {
  const {
    metadata: { uid, name },
  } = resource;
  const { eventingsubscription, ksservices } = resources;
  const edges = [];
  _.forEach(eventingsubscription?.data, (subRes) => {
    const channelData = subRes?.spec?.channel;
    if (name === channelData?.name && ksservices) {
      const svcData = subRes?.spec?.subscriber?.ref;
      svcData &&
        _.forEach(ksservices?.data, (res) => {
          const {
            metadata: { uid: resUid, name: resName },
          } = res;
          if (resName === svcData.name) {
            edges.push({
              id: `${uid}_${resUid}`,
              type: EdgeType.EventPubSubLink,
              source: uid,
              target: resUid,
              data: {
                resources: {
                  obj: subRes,
                  eventSources: getSubscribedEventsources(resource, resources),
                  channels: [resource],
                  ksservices: [res],
                },
              },
            });
          }
        });
    }
  });
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
  resource: K8sResourceKind,
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
    resource,
    resources: { ...svcRes },
    data: {
      url: knativeSvc.status?.url || '',
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

export const createTopologyPubSubNodeData = (
  resource: K8sResourceKind,
  res: TopologyOverviewItem,
  type: string,
): TopologyDataObject => {
  const {
    obj: {
      metadata: { name, uid, labels },
    },
  } = res;
  return {
    id: uid,
    name: name || labels?.['app.kubernetes.io/instance'],
    type,
    resource,
    resources: { ...res },
    data: {
      kind: referenceFor(res.obj),
      isKnativeResource: true,
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
        const data = createTopologyNodeData(
          res,
          item,
          type,
          getImageForIconClass(`icon-openshift`),
        );
        knDataModel.nodes.push(...getKnativeTopologyNodeItems(res, type, data, resources));
        knDataModel.edges.push(...getEventTopologyEdgeItems(res, resources.ksservices));
        // form node data for sink uri
        const sinkUri = res.spec?.sink?.uri;
        let sinkTargetUid = getSinkTargetUid(knDataModel.nodes, sinkUri);
        if (sinkUri) {
          if (!sinkTargetUid) {
            sinkTargetUid = encodeURIComponent(sinkUri);
            const eventSourcesData = getEventSourcesData(sinkUri, resources);
            const sinkUriObj = {
              metadata: {
                uid: sinkTargetUid,
                namespace: data.resources.obj.metadata.namespace || '',
              },
              spec: { sinkUri },
              type: { nodeType: NodeType.SinkUri },
            };
            const sinkData: TopologyDataObject = {
              id: sinkTargetUid,
              name: 'URI',
              type: NodeType.SinkUri,
              resources: { ...data.resources, obj: sinkUriObj, eventSources: eventSourcesData },
              data: { ...data.data, sinkUri },
              resource: sinkUriObj,
            };
            knDataModel.nodes.push(
              ...getSinkUriTopologyNodeItems(NodeType.SinkUri, sinkTargetUid, sinkData),
            );
          }
          knDataModel.edges.push(...getSinkUriTopologyEdgeItems(res, sinkTargetUid));
        }
        // form connections for channels
        if (!isInternalResource(res)) {
          const channelResourceProps = getDynamicChannelModelRefs();
          _.forEach(channelResourceProps, (currentProp) => {
            resources[currentProp] &&
              knDataModel.edges.push(...getEventTopologyEdgeItems(res, resources[currentProp]));
          });
        }
        knDataModel.edges.push(...getEventTopologyEdgeItems(res, resources.brokers));
        const newGroup = getTopologyGroupItems(res);
        mergeGroup(newGroup, knDataModel.nodes);
        break;
      }
      case NodeType.KnService: {
        const data = createTopologyServiceNodeData(res, item, type);
        knDataModel.nodes.push(...getKnativeTopologyNodeItems(res, type, data, resources));
        knDataModel.edges.push(...getTrafficTopologyEdgeItems(res, resources.revisions));
        const newGroup = getTopologyGroupItems(res);
        mergeGroup(newGroup, knDataModel.nodes);
        break;
      }
      case NodeType.PubSub: {
        if (!isInternalResource(res)) {
          const itemData = createPubSubDataItems(res, resources);
          const data = createTopologyPubSubNodeData(res, itemData, type);
          knDataModel.nodes.push(...getKnativeTopologyNodeItems(res, type, data, resources));
          if (res.kind === EventingBrokerModel.kind) {
            knDataModel.edges.push(...getTriggerTopologyEdgeItems(res, resources));
          } else {
            knDataModel.edges.push(...getSubscriptionTopologyEdgeItems(res, resources));
          }
          const newGroup = getTopologyGroupItems(res);
          mergeGroup(newGroup, knDataModel.nodes);
        }
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
      res,
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
  const eventSourceObj = _.omit(source, 'status');
  let sink = {};
  if (NodeType.SinkUri === target.type?.nodeType) {
    sink = {
      uri: target?.spec?.sinkUri,
    };
  } else {
    const targetName = _.get(target, 'metadata.name');
    sink = {
      ref: {
        apiVersion: target.apiVersion,
        kind: target.kind,
        name: targetName,
      },
    };
  }
  const updatePayload = {
    ...eventSourceObj,
    spec: { ...eventSourceObj.spec, sink },
  };
  return k8sUpdate(modelFor(referenceFor(source)), updatePayload);
};

export const isOperatorBackedKnResource = (
  obj: K8sResourceKind,
  resources: TopologyDataResources,
) => {
  const eventSourceProps = getDynamicEventSourcesModelRefs();
  return !!_.find(getKnativeDynamicResources(resources, eventSourceProps), (evsrc) =>
    obj.metadata?.labels?.[CAMEL_SOURCE_INTEGRATION]?.startsWith(evsrc.metadata.name),
  );
};

export const createSinkConnection = (source: Node, target: Node): Promise<K8sResourceKind> => {
  if (!source || !target || source === target) {
    return Promise.reject();
  }
  const sourceObj = getResource(source);
  const targetObj = getResource(target);

  return createKnativeEventSourceSink(sourceObj, targetObj);
};

export const createEventingPubSubSink = (subObj: K8sResourceKind, target: K8sResourceKind) => {
  if (!subObj || !target) {
    return Promise.reject();
  }
  const subscriptionObj = _.omit(subObj, 'status');
  const sink = {
    ref: {
      apiVersion: target.apiVersion,
      kind: target.kind,
      name: target.metadata?.name,
    },
  };
  const updatePayload = {
    ...subscriptionObj,
    spec: { ...subscriptionObj.spec, subscriber: { ...sink } },
  };

  return k8sUpdate(modelFor(referenceFor(subscriptionObj)), updatePayload);
};

export const createSinkPubSubConnection = (
  connector: Edge,
  targetNode: Node,
): Promise<K8sResourceKind> => {
  const { resources } = connector.getData();
  const target = targetNode.getData();
  if (!target || !resources?.obj) {
    return Promise.reject();
  }
  const targetObj = getTopologyResourceObject(target);
  return createEventingPubSubSink(resources.obj, targetObj);
};
