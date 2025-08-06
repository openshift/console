import { STORAGE_PREFIX } from '@console/shared/src/constants/common';

export const TYPE_WORKLOAD = 'workload';
export const TYPE_CONNECTS_TO = 'connects-to';
export const TYPE_AGGREGATE_EDGE = 'aggregate-edge';
export const TYPE_APPLICATION_GROUP = 'part-of';
export const TYPE_TRAFFIC_CONNECTOR = 'traffic-connector';
export const LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/last-topology-view`;
export const TOPOLOGY_LAYOUT_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/topology-layout`;
export const LAST_TOPOLOGY_OVERVIEW_OPEN_STORAGE_KEY = `${STORAGE_PREFIX}/last-topology-overview-open`;

const STORAGE_TOPOLOGY = 'topology';
const CONFIG_STORAGE_DEVCONSOLE = 'devconsole';

export const TOPOLOGY_VIEW_CONFIG_STORAGE_KEY = `${CONFIG_STORAGE_DEVCONSOLE}.${STORAGE_TOPOLOGY}.lastView`;
export const TOPOLOGY_LAYOUT_CONFIG_STORAGE_KEY = `${CONFIG_STORAGE_DEVCONSOLE}.${STORAGE_TOPOLOGY}.layout`;
export const TOPOLOGY_SIDE_BAR_WIDTH_STORAGE_KEY = `${CONFIG_STORAGE_DEVCONSOLE}.${STORAGE_TOPOLOGY}.sideBarSize`;

export const DEFAULT_NODE_PAD = 20;
export const DEFAULT_GROUP_PAD = 40;

export const NODE_WIDTH = 104;
export const NODE_HEIGHT = 104;
export const NODE_PADDING = [0, DEFAULT_NODE_PAD];

export const GROUP_WIDTH = 300;
export const GROUP_HEIGHT = 180;
export const GROUP_PADDING = [
  DEFAULT_GROUP_PAD,
  DEFAULT_GROUP_PAD,
  DEFAULT_GROUP_PAD + 20,
  DEFAULT_GROUP_PAD,
];

export const CREATE_APPLICATION_KEY = '#CREATE_APPLICATION_KEY#';
export const UNASSIGNED_KEY = '#UNASSIGNED_APP#';

export const ALLOW_EXPORT_APP = 'ALLOW_EXPORT_APP';
export const EXPORT_CR_NAME = 'primer';
export const EXPORT_JOB_PREFIX = 'primer-export-';

export const ROUTE_URL_ANNOTATION = 'app.openshift.io/route-url';
export const ROUTE_DISABLED_ANNOTATION = 'app.openshift.io/route-disabled';
