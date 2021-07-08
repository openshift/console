import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import {
  TYPE_KNATIVE_SERVICE,
  TYPE_SINK_URI,
  TYPE_EVENT_SOURCE,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_EVENT_PUB_SUB,
  TYPE_EVENT_PUB_SUB_LINK,
  TYPE_KNATIVE_REVISION,
  TYPE_EVENT_SOURCE_KAFKA,
} from '../const';
import { KnativeRevisionListViewNode } from './KnativeRevisionListViewNode';
import { KnativeServiceListViewNode } from './KnativeServiceListViewNode';
import { NoStatusListViewNode } from './NoStatusListViewNode';
import { SinkUriListViewNode } from './SinkUriListViewNode';

export const knativeListViewNodeComponentFactory = (
  type,
):
  | React.ComponentType<{
      item: Node;
      selectedIds: string[];
      onSelect: (ids: string[]) => void;
    }>
  | undefined => {
  switch (type) {
    case TYPE_KNATIVE_SERVICE:
      return KnativeServiceListViewNode;
    case TYPE_KNATIVE_REVISION:
      return KnativeRevisionListViewNode;
    case TYPE_SINK_URI:
      return SinkUriListViewNode;
    case TYPE_EVENT_PUB_SUB_LINK:
    case TYPE_EVENT_SOURCE:
    case TYPE_EVENT_SOURCE_LINK:
    case TYPE_EVENT_PUB_SUB:
    case TYPE_EVENT_SOURCE_KAFKA:
      return NoStatusListViewNode;
    default:
      return null;
  }
};
