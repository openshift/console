import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import {
  Node,
  observer,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  useAnchor,
  WithDragNodeProps,
  AnchorEnd,
  RectAnchor,
} from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { WithCreateConnectorProps } from '@console/topology/src/behavior';
import { BaseNode } from '@console/topology/src/components/graph-view/components/nodes';
import { TYPE_AGGREGATE_EDGE } from '@console/topology/src/const';
import { getTopologyResourceObject } from '@console/topology/src/utils';
import * as eventPubSubImg from '../../../imgs/event-pub-sub.svg';
import { TYPE_EVENT_SINK_LINK } from '../../const';
import EventSinkSourceAnchor from '../anchors/EventSinkSourceAnchor';
import PubSubSourceAnchor from '../anchors/PubSubSourceAnchor';
import PubSubTargetAnchor from '../anchors/PubSubTargetAnchor';

import './EventingPubSubNode.scss';

export type EventingPubSubNodeProps = {
  element: Node;
  canDrop?: boolean;
  dropTarget?: boolean;
  dragging?: boolean;
  edgeDragging?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const EventingPubSubNode: React.FC<EventingPubSubNodeProps> = ({
  element,
  canDrop,
  dropTarget,
  children,
  ...rest
}) => {
  useAnchor(PubSubSourceAnchor, AnchorEnd.source);
  useAnchor(PubSubTargetAnchor, AnchorEnd.target);
  useAnchor(RectAnchor, AnchorEnd.source, TYPE_AGGREGATE_EDGE);
  useAnchor(RectAnchor, AnchorEnd.target, TYPE_AGGREGATE_EDGE);
  useAnchor(EventSinkSourceAnchor, AnchorEnd.source, TYPE_EVENT_SINK_LINK);

  const { t } = useTranslation();
  const { data } = element.getData();
  const { width } = element.getBounds();

  const resourceObj = getTopologyResourceObject(element.getData());

  return (
    <Tooltip
      content={t('knative-plugin~Move sink to {{resourceObjKind}}', {
        resourceObjKind: resourceObj.kind,
      })}
      trigger="manual"
      isVisible={dropTarget && canDrop}
      animationDuration={0}
    >
      <BaseNode
        className="odc-eventing-pubsub"
        createConnectorAccessVerb="create"
        kind={data.kind}
        element={element}
        dropTarget={dropTarget}
        canDrop={canDrop}
        {...rest}
      >
        <image
          x={width * 0.1}
          y={0}
          width={width * 0.8}
          height={width * 0.5}
          xlinkHref={eventPubSubImg}
          className="odc-eventing-pubsub--image"
        />
        {children}
      </BaseNode>
    </Tooltip>
  );
};

export default observer(EventingPubSubNode);
