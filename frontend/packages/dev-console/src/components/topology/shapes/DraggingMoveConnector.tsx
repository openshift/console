import * as React from 'react';
import { createSvgIdUrl } from '../../../utils/svg-utils';
import { NodeProps } from '../topology-types';
import SvgArrowMarker from './SvgArrowMarker';

const TARGET_ARROW_MARKER_ID = 'createConnectionTargetArrowMarker';

export type DraggingMoveConnectorProps = NodeProps & {
  dragX: number;
  dragY: number;
};

export const DraggingMoveConnector: React.FC<DraggingMoveConnectorProps> = ({
  x,
  y,
  size,
  dragX,
  dragY,
}) => {
  // Get the start point which is on the edge of the node
  const length = Math.sqrt((dragX - x) ** 2 + (dragY - y) ** 2);
  const ratio = size / 2 / length;
  const startX: number = x + (dragX - x) * ratio;
  const startY: number = y + (dragY - y) * ratio;

  return (
    <g>
      <SvgArrowMarker
        id={TARGET_ARROW_MARKER_ID}
        nodeSize={-5}
        markerSize={12}
        className="odc-creator-edge-marker"
      />
      <line
        className="odc-base-edge odc-move-edge"
        x1={startX}
        y1={startY}
        x2={dragX}
        y2={dragY}
        markerEnd={createSvgIdUrl(TARGET_ARROW_MARKER_ID)}
      />
    </g>
  );
};
