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
  useSvgAnchor,
} from '@console/topology';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import Decorator from '../../../topology/shapes/Decorator';

import './KnativeService.scss';

export type EventSourceProps = {
  element: Node;
  dragging: boolean;
  regrouping: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithContextMenuProps;

const KnativeService: React.FC<EventSourceProps> = ({
  element,
  selected,
  onSelect,
  onContextMenu,
  dragNodeRef,
  dragging,
  regrouping,
}) => {
  const trafficAnchor = useSvgAnchor(AnchorEnd.source, 'revision-traffic');
  useAnchor(RectAnchor);
  const { x, y, width, height } = element.getBounds();
  const { data } = element.getData();

  return (
    <g onClick={onSelect} onContextMenu={onContextMenu}>
      <Layer id={dragging && regrouping ? undefined : 'groups2'}>
        <rect
          ref={dragNodeRef}
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
        />
      </Layer>
      {data.url ? (
        <Tooltip key="route" content="Open URL" position={TooltipPosition.right}>
          <Decorator
            circleRef={trafficAnchor}
            x={x + width}
            y={y}
            radius={13}
            href={data.url}
            external
          >
            <g transform="translate(-6.5, -6.5)">
              <ExternalLinkAltIcon style={{ fontSize: 13 }} alt="Open URL" />
            </g>
          </Decorator>
        </Tooltip>
      ) : (
        <circle ref={trafficAnchor} cx={width} cy={0} r={0} fill="none" />
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
