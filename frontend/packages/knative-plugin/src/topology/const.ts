import { DEFAULT_GROUP_PAD, GROUP_WIDTH } from '@console/topology/src/const';

export const TYPE_EVENT_SOURCE = 'event-source';
export const TYPE_EVENT_SINK = 'event-sink';
export const TYPE_EVENT_SOURCE_KAFKA = 'event-source-kafka';
export const TYPE_EVENT_SOURCE_LINK = 'event-source-link';
export const TYPE_EVENT_SINK_LINK = 'event-sink-link';
export const TYPE_KAFKA_CONNECTION_LINK = 'event-source-kafka-link';
export const TYPE_EVENT_PUB_SUB = 'event-pubsub';
export const TYPE_EVENT_PUB_SUB_LINK = 'event-pubsub-link';
export const TYPE_KNATIVE_SERVICE = 'knative-service';
export const TYPE_REVISION_TRAFFIC = 'revision-traffic';
export const TYPE_KNATIVE_REVISION = 'knative-revision';
export const TYPE_SINK_URI = 'sink-uri';

export const KNATIVE_GROUP_NODE_WIDTH = GROUP_WIDTH;
export const KNATIVE_GROUP_NODE_HEIGHT = 100;
export const KNATIVE_GROUP_NODE_PADDING = [
  DEFAULT_GROUP_PAD,
  DEFAULT_GROUP_PAD,
  DEFAULT_GROUP_PAD + 10,
  DEFAULT_GROUP_PAD,
];

export const EVENT_MARKER_RADIUS = 6;

// URI Kind
export const URI_KIND = 'URI';
