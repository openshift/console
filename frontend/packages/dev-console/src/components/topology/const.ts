import { STORAGE_PREFIX } from '@console/shared';

export const TYPE_WORKLOAD = 'workload';
export const TYPE_EVENT_SOURCE = 'event-source';
export const TYPE_EVENT_SOURCE_LINK = 'event-source-link';
export const TYPE_CONNECTS_TO = 'connects-to';
export const TYPE_AGGREGATE_EDGE = 'aggregate-edge';
export const TYPE_SERVICE_BINDING = 'service-binding';
export const TYPE_APPLICATION_GROUP = 'part-of';
export const TYPE_KNATIVE_SERVICE = 'knative-service';
export const TYPE_REVISION_TRAFFIC = 'revision-traffic';
export const TYPE_KNATIVE_REVISION = 'knative-revision';
export const TYPE_HELM_RELEASE = 'helm-release';
export const TYPE_HELM_WORKLOAD = 'helm-workload';
export const TYPE_OPERATOR_BACKED_SERVICE = 'operator-backed-service';
export const TYPE_OPERATOR_WORKLOAD = 'operator-workload';
export const TYPE_TRAFFIC_CONNECTOR = 'traffic-connector';
export const LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/last-topology-view`;

const DEFAULT_NODE_PAD = 20;
const DEFAULT_GROUP_PAD = 40;

export const NODE_WIDTH = 104;
export const NODE_HEIGHT = 104;
export const NODE_PADDING = [0, DEFAULT_NODE_PAD];

export const GROUP_WIDTH = 300;
export const GROUP_HEIGHT = 180;
export const GROUP_PADDING = [DEFAULT_GROUP_PAD];

export const KNATIVE_GROUP_NODE_HEIGHT = 100;
export const KNATIVE_GROUP_NODE_PADDING = [
  DEFAULT_GROUP_PAD,
  DEFAULT_GROUP_PAD,
  DEFAULT_GROUP_PAD + 10,
  DEFAULT_GROUP_PAD,
];
