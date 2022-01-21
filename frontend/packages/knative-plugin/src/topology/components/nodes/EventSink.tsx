import * as React from 'react';
import { SignInAltIcon } from '@patternfly/react-icons';
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
  useAnchor,
  AnchorEnd,
} from '@patternfly/react-topology';
import classnames from 'classnames';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
  PodSet,
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
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';
import { TYPE_EVENT_SINK_LINK, TYPE_KAFKA_CONNECTION_LINK } from '../../const';
import EventSinkTargetAnchor from '../anchors/EventSinkTargetAnchor';

import './EventSource.scss';

export type EventSinkProps = {
  element: Node;
  dragging?: boolean;
  edgeDragging?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const EventSink: React.FC<EventSinkProps> = ({
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
  useAnchor(EventSinkTargetAnchor, AnchorEnd.target, TYPE_EVENT_SINK_LINK);
  const [hover, hoverRef] = useHover();
  const groupRefs = useCombineRefs(dragNodeRef, dndDropRef, hoverRef);
  const { data, resources, resource } = element.getData();
  const [filtered] = useSearchFilter(element.getLabel(), resource?.metadata?.labels);
  const displayFilters = useDisplayFilters();
  const showLabelsFilter = getFilterById(SHOW_LABELS_FILTER_ID, displayFilters);
  const showLabels = showLabelsFilter?.value || hover;
  const { width, height } = element.getBounds();
  const size = Math.min(width, height);
  const allowEdgeCreation = useAllowEdgeCreation();
  const isKafkaConnectionLinkPresent =
    element.getSourceEdges()?.filter((edge: Edge) => edge.getType() === TYPE_KAFKA_CONNECTION_LINK)
      .length > 0;
  const revisionIds = resources.revisions?.map((revision) => revision.metadata.uid);
  const { loaded, loadError, pods } = usePodsForRevisions(revisionIds, resource.metadata.namespace);
  const donutStatus = React.useMemo(() => {
    if (loaded && !loadError) {
      const [current, previous] = pods;
      const isRollingOut = !!current && !!previous;
      return {
        obj: resource,
        current,
        previous,
        isRollingOut,
        pods: [...(current?.pods || []), ...(previous?.pods || [])],
      };
    }
    return null;
  }, [loaded, loadError, pods, resource]);

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
      className={classnames('odc-event-source', {
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
      {donutStatus && <PodSet size={size * 0.75} x={width / 2} y={height / 2} data={donutStatus} />}
      <image
        x={width * 0.33}
        y={height * 0.33}
        width={size * 0.35}
        height={size * 0.35}
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
          typeIcon={<SignInAltIcon />}
        >
          {element.getLabel()}
        </SvgBoxedText>
      )}
    </g>
  );
};

export default observer(EventSink);
