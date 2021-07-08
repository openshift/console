import * as React from 'react';
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
  WithCreateConnectorProps,
  Edge,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
} from '@console/topology/src/components/graph-view';
import SvgBoxedText from '@console/topology/src/components/svg/SvgBoxedText';
import {
  useSearchFilter,
  useDisplayFilters,
  getFilterById,
  SHOW_LABELS_FILTER_ID,
  useAllowEdgeCreation,
} from '@console/topology/src/filters';
import { getEventSourceIcon } from '../../../utils/get-knative-icon';
import { TYPE_KAFKA_CONNECTION_LINK } from '../../const';

import './EventSource.scss';

export type EventSourceProps = {
  element: Node;
  dragging?: boolean;
  edgeDragging?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

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
  onShowCreateConnector,
  onHideCreateConnector,
}) => {
  const svgAnchorRef = useSvgAnchor();
  const [hover, hoverRef] = useHover();
  const groupRefs = useCombineRefs(dragNodeRef, dndDropRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const displayFilters = useDisplayFilters();
  const showLabelsFilter = getFilterById(SHOW_LABELS_FILTER_ID, displayFilters);
  const showLabels = showLabelsFilter?.value || hover;
  const { width, height } = element.getBounds();
  const size = Math.min(width, height);
  const { data, resources } = element.getData();
  const allowEdgeCreation = useAllowEdgeCreation();
  const isKafkaConnectionLinkPresent =
    element.getSourceEdges()?.filter((edge: Edge) => edge.getType() === TYPE_KAFKA_CONNECTION_LINK)
      .length > 0;

  React.useLayoutEffect(() => {
    if (allowEdgeCreation && !isKafkaConnectionLinkPresent) {
      if (hover) {
        onShowCreateConnector && onShowCreateConnector();
      } else {
        onHideCreateConnector && onHideCreateConnector();
      }
    }
  }, [
    hover,
    onShowCreateConnector,
    onHideCreateConnector,
    allowEdgeCreation,
    isKafkaConnectionLinkPresent,
  ]);

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
        key={hover || dragging || contextMenuOpen ? 'polygon-hover' : 'polygon'}
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
        xlinkHref={getEventSourceIcon(data.kind, resources.obj)}
      />
      {showLabels && (data.kind || element.getLabel()) && (
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
