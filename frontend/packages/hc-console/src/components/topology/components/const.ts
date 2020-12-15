import { STORAGE_PREFIX } from '@console/shared';

export const TYPE_WORKLOAD = 'workload';
export const TYPE_CONNECTS_TO = 'connects-to';
export const TYPE_AGGREGATE_EDGE = 'aggregate-edge';
export const TYPE_SERVICE_BINDING = 'service-binding';
export const TYPE_APPLICATION_GROUP = 'part-of';
export const TYPE_TRAFFIC_CONNECTOR = 'traffic-connector';
export const LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/last-topology-view`;

export const DEFAULT_NODE_PAD = 20;
export const DEFAULT_GROUP_PAD = 40;

export const NODE_WIDTH = 104;
export const NODE_HEIGHT = 104;
export const NODE_PADDING = [0, DEFAULT_NODE_PAD];

export const GROUP_WIDTH = 300;
export const GROUP_HEIGHT = 180;
export const GROUP_PADDING = [DEFAULT_GROUP_PAD];
