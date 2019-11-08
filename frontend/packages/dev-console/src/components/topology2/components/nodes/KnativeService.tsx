import * as React from 'react';
import cx from 'classnames';
import { TooltipPosition, Tooltip } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import {
  Node,
  AnchorEnd,
  observer,
  WithSelectionProps,
  WithContextMenuProps,
  RectAnchor,
  useAnchor,
  WithDragNodeProps,
  Layer,
  useHover,
  createSvgIdUrl,
  useCombineRefs,
} from '@console/topology';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import Decorator from '../../../topology/shapes/Decorator';
import RevisionTrafficSourceAnchor from '../anchors/RevisionTrafficSourceAnchor';
import NodeShadows, { NODE_SHADOW_FILTER_ID, NODE_SHADOW_FILTER_ID_HOVER } from '../NodeShadows';

import './KnativeService.scss';

export type EventSourceProps = {
  element: Node;
  dragging: boolean;
  regrouping: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithContextMenuProps;

const DECORATOR_RADIUS = 13;
const KnativeService: React.FC<EventSourceProps> = ({
  element,
  selected,
  onSelect,
  onContextMenu,
  dragNodeRef,
  dragging,
  regrouping,
}) => {
  const [hover, hoverRef] = useHover();
  const [innerHover, innerHoverRef] = useHover();
  const nodeRefs = useCombineRefs(innerHoverRef, dragNodeRef);
  const { data } = element.getData();
  const hasDataUrl = !!data.url;
  useAnchor(
    React.useCallback(
      (node: Node) => new RevisionTrafficSourceAnchor(node, hasDataUrl ? DECORATOR_RADIUS : 0),
      [hasDataUrl],
    ),
    AnchorEnd.source,
    'revision-traffic',
  );
  useAnchor(RectAnchor);
  const { x, y, width, height } = element.getBounds();

  return (
    <g ref={hoverRef} onClick={onSelect} onContextMenu={onContextMenu}>
      <NodeShadows />
      <Layer id={dragging && regrouping ? undefined : 'groups2'}>
        <rect
          ref={nodeRefs}
          className={cx('odc-knative-service', {
            'is-selected': selected,
            'is-dragging': dragging,
          })}
          x={x}
          y={y}
          width={width}
          height={height}
          rx="5"
          ry="5"
          filter={createSvgIdUrl(
            hover || innerHover || dragging ? NODE_SHADOW_FILTER_ID_HOVER : NODE_SHADOW_FILTER_ID,
          )}
        />
      </Layer>
      {hasDataUrl && (
        <Tooltip key="route" content="Open URL" position={TooltipPosition.right}>
          <Decorator x={x + width} y={y} radius={DECORATOR_RADIUS} href={data.url} external>
            <g transform="translate(-6.5, -6.5)">
              <ExternalLinkAltIcon style={{ fontSize: DECORATOR_RADIUS }} alt="Open URL" />
            </g>
          </Decorator>
        </Tooltip>
      )}
      {(data.kind || element.getLabel()) && (
        <SvgBoxedText
          className="odc-knative-service__label odc2-base-node__label"
          x={x + width / 2}
          y={y + height + 20}
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

export default observer(KnativeService);
