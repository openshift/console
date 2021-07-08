import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { ExternalLinkAltIcon, LinkIcon } from '@patternfly/react-icons';
import {
  Node,
  observer,
  WithDragNodeProps,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  useHover,
  useCombineRefs,
  useAnchor,
  createSvgIdUrl,
  EllipseAnchor,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { calculateRadius } from '@console/shared';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
  Decorator,
} from '@console/topology/src/components/graph-view';
import { EVENT_MARKER_RADIUS } from '../../const';

import './SinkUriNode.scss';

export type SinkUriNodeProps = {
  element: Node;
  dragging?: boolean;
  edgeDragging?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps;

const DECORATOR_RADIUS = 13;
const SinkUriNode: React.FC<SinkUriNodeProps> = ({
  element,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dragNodeRef,
  dndDropRef,
  dragging,
  edgeDragging,
  canDrop,
  dropTarget,
}) => {
  useAnchor(React.useCallback((node: Node) => new EllipseAnchor(node, EVENT_MARKER_RADIUS), []));
  const [hover, hoverRef] = useHover();
  const { t } = useTranslation();
  const groupRefs = useCombineRefs<SVGCircleElement>(hoverRef, dragNodeRef);
  const { width, height } = element.getDimensions();
  const sinkData = element.getData().data;
  const size = Math.min(width, height);
  const { radius } = calculateRadius(size);
  const cx = width / 2;
  const cy = height / 2;
  return (
    <Tooltip
      content={t('knative-plugin~Move sink to URI')}
      trigger="manual"
      isVisible={dropTarget && canDrop}
      animationDuration={0}
    >
      <g
        className={classNames('odc-sink-uri', {
          'is-dragging': dragging,
          'is-highlight': canDrop || edgeDragging,
        })}
        onClick={onSelect}
        onContextMenu={onContextMenu}
        ref={hoverRef}
      >
        <NodeShadows />
        <g
          className={classNames('odc-sink-uri', {
            'is-dragging': dragging,
            'is-highlight': canDrop || edgeDragging,
            'is-selected': selected,
            'is-dropTarget': canDrop && dropTarget,
          })}
          ref={groupRefs}
        >
          <circle
            key={hover || dragging || contextMenuOpen ? 'circle-hover' : 'circle'}
            className="odc-sink-uri__bg"
            ref={dndDropRef}
            cx={cx}
            cy={cy}
            r={radius}
            filter={createSvgIdUrl(
              hover || dragging || contextMenuOpen
                ? NODE_SHADOW_FILTER_ID_HOVER
                : NODE_SHADOW_FILTER_ID,
            )}
          />
          <g transform={`translate(${cx / 2}, ${cy / 2})`}>
            <LinkIcon style={{ fontSize: radius }} />
          </g>
        </g>
        {sinkData.sinkUri && (
          <Tooltip
            key="URI"
            content={t('knative-plugin~Open URI')}
            position={TooltipPosition.right}
          >
            <Decorator
              x={cx + radius - DECORATOR_RADIUS * 0.7}
              y={cy - radius + DECORATOR_RADIUS * 0.7}
              radius={DECORATOR_RADIUS}
              href={sinkData.sinkUri}
              external
            >
              <g transform={`translate(-${DECORATOR_RADIUS / 2}, -${DECORATOR_RADIUS / 2})`}>
                <ExternalLinkAltIcon style={{ fontSize: DECORATOR_RADIUS }} title="Open URL" />
              </g>
            </Decorator>
          </Tooltip>
        )}
      </g>
    </Tooltip>
  );
};

export default observer(SinkUriNode);
