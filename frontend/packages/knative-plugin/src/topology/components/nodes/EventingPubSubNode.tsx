import * as React from 'react';
import * as classNames from 'classnames';
import { Tooltip } from '@patternfly/react-core';
import {
  Node,
  observer,
  useHover,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  useAnchor,
  useCombineRefs,
  createSvgIdUrl,
  WithDragNodeProps,
  AnchorEnd,
} from '@console/topology';
import SvgBoxedText from '@console/dev-console/src/components/svg/SvgBoxedText';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
  useSearchFilter,
  useDisplayFilters,
  getFilterById,
  SHOW_LABELS_FILTER_ID,
} from '@console/dev-console/src/components/topology';
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
  WithContextMenuProps;

const EventingPubSubNode: React.FC<EventingPubSubNodeProps> = ({
  element,
  canDrop,
  dropTarget,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dragNodeRef,
  dndDropRef,
  dragging,
  edgeDragging,
}) => {
  useAnchor(PubSubSourceAnchor, AnchorEnd.source);
  useAnchor(PubSubTargetAnchor, AnchorEnd.target);
  const [hover, hoverRef] = useHover();

  const groupRefs = useCombineRefs(dragNodeRef, dndDropRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const displayFilters = useDisplayFilters();
  const showLabelsFilter = getFilterById(SHOW_LABELS_FILTER_ID, displayFilters);
  const showLabels = showLabelsFilter?.value || hover;
  const { width, height } = element.getBounds();
  const { data } = element.getData();

  return (
    <Tooltip
      content="Move sink to Channel"
      trigger="manual"
      isVisible={dropTarget && canDrop}
      tippyProps={{ duration: 0, delay: 0 }}
    >
      <g
        className={classNames('odc-eventing-pubsub', {
          'is-dragging': dragging,
          'is-highlight': canDrop || edgeDragging,
          'is-selected': selected,
          'is-dropTarget': canDrop && dropTarget,
          'is-filtered': filtered,
        })}
        onClick={onSelect}
        onContextMenu={onContextMenu}
        ref={groupRefs}
      >
        <NodeShadows />
        <rect
          className="odc-eventing-pubsub__bg"
          x={0}
          y={0}
          width={width}
          height={height}
          rx="15"
          ry="15"
          filter={createSvgIdUrl(
            hover || dragging || contextMenuOpen || dropTarget
              ? NODE_SHADOW_FILTER_ID_HOVER
              : NODE_SHADOW_FILTER_ID,
          )}
        />
        {showLabels && (data.kind || element.getLabel()) && (
          <SvgBoxedText
            className="odc-eventing-pubsub__label odc-base-node__label"
            x={width / 2}
            y={height + 20}
            paddingX={8}
            paddingY={4}
            kind={data.kind}
          >
            {element.getLabel()}
          </SvgBoxedText>
        )}
      </g>
    </Tooltip>
  );
};

export default observer(EventingPubSubNode);
