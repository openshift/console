import * as React from 'react';
import { TrashIcon } from '@patternfly/react-icons';
import { boundingBoxForLine, PointTuple } from '@console/topology';
import { EdgeProps } from '../../topology2/topology-types';
import BaseEdge from './BaseEdge';
import SvgArrowMarker from './SvgArrowMarker';

import './ConnectsTo.scss';

type ConnectsToProps = EdgeProps;

const TARGET_ARROW_MARKER_ID = 'connectsToTargetArrowMarker';
const TARGET_ARROW_MARKER_HOVER_ID = 'connectsToTargetArrowMarker--hover';

const removeRadius = 14;

const arrowBoundingBox = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  size: number,
): [PointTuple, PointTuple, PointTuple, PointTuple] => {
  const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
  if (!length) {
    return null;
  }

  let ratio = (length - size / 2) / length;
  const endPoint: PointTuple = [startX + (endX - startX) * ratio, startY + (endY - startY) * ratio];
  ratio = (length - size / 2 - 20) / length;
  const startPoint: PointTuple = [
    startX + (endX - startX) * ratio,
    startY + (endY - startY) * ratio,
  ];

  return boundingBoxForLine(startPoint, endPoint, () => 10);
};

const ConnectsTo: React.FC<ConnectsToProps> = ({
  source,
  target,
  dragActive,
  isDragging,
  targetArrowRef,
  onRemove,
}) => {
  const arrowBox = arrowBoundingBox(source.x, source.y, target.x, target.y, target.size);
  const lineBox = boundingBoxForLine([source.x, source.y], [target.x, target.y], () => 3);
  const [hover, setHover] = React.useState(false);

  return (
    <>
      <g
        data-test-id="connects-to-handler"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <path
          d={`M ${lineBox[0]} L ${lineBox[1]} L ${lineBox[2]} L ${lineBox[3]} Z`}
          fillOpacity={0}
        />
        <SvgArrowMarker id={TARGET_ARROW_MARKER_ID} nodeSize={source.size} markerSize={12} />
        <SvgArrowMarker
          className="odc-connects-to__hover-arrow"
          id={TARGET_ARROW_MARKER_HOVER_ID}
          nodeSize={source.size}
          markerSize={12}
        />
        <BaseEdge
          source={source}
          target={target}
          targetMarkerId={
            hover && !dragActive ? TARGET_ARROW_MARKER_HOVER_ID : TARGET_ARROW_MARKER_ID
          }
          isDragging={isDragging}
          isHover={hover}
        />
        {hover && !dragActive && (
          <g
            transform={`translate(${source.x + (target.x - source.x) * 0.5}, ${source.y +
              (target.y - source.y) * 0.5})`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove && onRemove();
            }}
          >
            <circle className="odc-connects-to__remove-bg" cx={0} cy={0} r={removeRadius} />
            <g transform={`translate(-${removeRadius / 2}, -${removeRadius / 2})`}>
              <TrashIcon
                className="odc-connects-to__remove-icon"
                style={{ fontSize: removeRadius }}
                alt="Remove Connection"
              />
            </g>
          </g>
        )}
      </g>
      {arrowBox && (
        <path
          className="odc-connects-to__target-box"
          ref={targetArrowRef}
          d={`M ${arrowBox[0]} L ${arrowBox[1]} L ${arrowBox[2]} L ${arrowBox[3]} Z`}
          fillOpacity={0}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        />
      )}
    </>
  );
};

export default ConnectsTo;
