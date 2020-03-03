import * as React from 'react';
import * as classNames from 'classnames';
import {
  Node,
  observer,
  useHover,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  useSvgAnchor,
  useCombineRefs,
  WithDragNodeProps,
  createSvgIdUrl,
} from '@console/topology';
import { getKnativeEventSourceIcon } from '@console/knative-plugin';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import useSearchFilter from '../../filters/useSearchFilter';
import NodeShadows, { NODE_SHADOW_FILTER_ID_HOVER, NODE_SHADOW_FILTER_ID } from '../NodeShadows';

import './EventSource.scss';

export type EventSourceProps = {
  element: Node;
  dragging?: boolean;
  edgeDragging?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps;

const EventSource: React.FC<EventSourceProps> = ({
  element,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dragNodeRef,
  dndDropRef,
  dragging,
  edgeDragging,
}) => {
  const svgAnchorRef = useSvgAnchor();
  const [hover, hoverRef] = useHover();
  const groupRefs = useCombineRefs(dragNodeRef, dndDropRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const { width, height } = element.getBounds();
  const size = Math.min(width, height);
  const { data } = element.getData();

  return (
    <g
      className={classNames('odc-event-source', {
        'is-filtered': filtered,
        'is-dragging': dragging || edgeDragging,
        'is-selected': selected,
      })}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      ref={groupRefs}
    >
      <NodeShadows />
      <polygon
        className="odc-event-source__bg"
        ref={svgAnchorRef}
        filter={createSvgIdUrl(
          hover || dragging || contextMenuOpen
            ? NODE_SHADOW_FILTER_ID_HOVER
            : NODE_SHADOW_FILTER_ID,
        )}
        points={`${width / 2}, ${(height - size) / 2} ${width - (width - size) / 2},${height /
          2} ${width / 2},${height - (height - size) / 2} ${(width - size) / 2},${height / 2}`}
      />
      <image
        x={width * 0.25}
        y={height * 0.25}
        width={size * 0.5}
        height={size * 0.5}
        xlinkHref={getKnativeEventSourceIcon(data.kind)}
      />
      {(data.kind || element.getLabel()) && (
        <SvgBoxedText
          className="odc-base-node__label"
          x={width / 2}
          y={(height + size) / 2 + 20}
          paddingX={8}
          paddingY={4}
          kind={data.kind}
        >
          {element.getLabel()}
        </SvgBoxedText>
      )}
    </g>
  );
};

export default observer(EventSource);
