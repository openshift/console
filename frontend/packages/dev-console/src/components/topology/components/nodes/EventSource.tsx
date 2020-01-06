import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import {
  Node,
  observer,
  useHover,
  WithSelectionProps,
  WithContextMenuProps,
  useSvgAnchor,
  useCombineRefs,
  WithDragNodeProps,
  createSvgIdUrl,
} from '@console/topology';
import { RootState } from '@console/internal/redux';
import { getKnativeEventSourceIcon } from '@console/knative-plugin';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import useFilter from '../../filters/useFilter';
import { getTopologyFilters, TopologyFilters } from '../../filters/filter-utils';
import { getTopologyResourceObject } from '../../topology-utils';
import NodeShadows, { NODE_SHADOW_FILTER_ID_HOVER, NODE_SHADOW_FILTER_ID } from '../NodeShadows';

import './EventSource.scss';

export type EventSourceProps = {
  element: Node;
  dragging?: boolean;
  filters?: TopologyFilters;
} & WithSelectionProps &
  WithDragNodeProps &
  WithContextMenuProps;

const EventSource: React.FC<EventSourceProps> = ({
  element,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dragNodeRef,
  dragging,
  filters,
}) => {
  const svgAnchorRef = useSvgAnchor();
  const [hover, hoverRef] = useHover();
  const groupRefs = useCombineRefs(dragNodeRef, hoverRef);
  const filtered = useFilter(filters, getTopologyResourceObject(element.getData()));
  const { width, height } = element.getBounds();
  const size = Math.min(width, height);
  const { data } = element.getData();

  return (
    <g
      className={classNames('odc-event-source', {
        'is-filtered': filtered,
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

      {selected && (
        <polygon
          className="odc-event-source__selection"
          points={`${width / 2}, ${(height - size) / 2 - 2} ${width -
            (width - size) / 2 +
            2},${height / 2} ${width / 2},${height - (height - size) / 2 + 2} ${(width - size) / 2 -
            2},${height / 2}`}
        />
      )}
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
          truncate={16}
        >
          {element.getLabel()}
        </SvgBoxedText>
      )}
    </g>
  );
};
const EventSourceState = (state: RootState) => {
  const filters = getTopologyFilters(state);
  return { filters };
};
export default connect(EventSourceState)(observer(EventSource));
