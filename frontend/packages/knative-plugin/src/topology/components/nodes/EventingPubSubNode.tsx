import type { ReactNode, FC } from 'react';
import { useRef } from 'react';
import { Tooltip } from '@patternfly/react-core';
import type {
  Node,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  WithDragNodeProps,
} from '@patternfly/react-topology';
import { observer, useAnchor, AnchorEnd, RectAnchor } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import type { WithCreateConnectorProps } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { BaseNode } from '@console/topology/src/components/graph-view/components/nodes';
import { TYPE_AGGREGATE_EDGE } from '@console/topology/src/const';
import { getTopologyResourceObject } from '@console/topology/src/utils';
import eventPubSubImg from '../../../imgs/event-pub-sub.svg';
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
  children?: ReactNode;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const EventingPubSubNode: FC<EventingPubSubNodeProps> = ({
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

  const ref = useRef();
  const { t } = useTranslation();
  const { data } = element.getData();
  const { width } = element.getBounds();

  const resourceObj = getTopologyResourceObject(element.getData());

  return (
    <Tooltip
      triggerRef={ref}
      content={t('knative-plugin~Move sink to {{resourceObjKind}}', {
        resourceObjKind: resourceObj.kind,
      })}
      trigger="manual"
      isVisible={dropTarget && canDrop}
      animationDuration={0}
    >
      <g ref={ref}>
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
      </g>
    </Tooltip>
  );
};

export default observer(EventingPubSubNode);
