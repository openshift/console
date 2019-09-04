import * as React from 'react';
import { EdgeProps } from '../topology-types';
import { boundingBoxForLine, Point } from '../../../utils/svg-utils';
import BaseEdge from './BaseEdge';
import SvgArrowMarker from './SvgArrowMarker';

import './ConnectsTo.scss';

type ConnectsToProps = EdgeProps;

const TARGET_ARROW_MARKER_ID = 'connectsToTargetArrowMarker';
const TARGET_ARROW_MARKER_HOVER_ID = 'connectsToTargetArrowMarker--hover';

const arrowBoundingBox = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  size: number,
): [Point, Point, Point, Point] => {
  const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
  if (!length) {
    return null;
  }

  let ratio = (length - size / 2) / length;
  const endPoint: Point = [startX + (endX - startX) * ratio, startY + (endY - startY) * ratio];
  ratio = (length - size / 2 - 20) / length;
  const startPoint: Point = [startX + (endX - startX) * ratio, startY + (endY - startY) * ratio];

  return boundingBoxForLine(startPoint, endPoint, () => 10);
};

const ConnectsTo: React.FC<ConnectsToProps> = ({ source, target, isDragging, targetArrowRef }) => {
  const arrowBox = arrowBoundingBox(source.x, source.y, target.x, target.y, target.size);
  const lineBox = boundingBoxForLine([source.x, source.y], [target.x, target.y], () => 3);
  const [hover, setHover] = React.useState(false);

  return (
    <React.Fragment>
      <g onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <SvgArrowMarker id={TARGET_ARROW_MARKER_ID} nodeSize={source.size} markerSize={12} />
        <SvgArrowMarker
          className="odc-hover-arrow"
          id={TARGET_ARROW_MARKER_HOVER_ID}
          nodeSize={source.size}
          markerSize={12}
        />
        <BaseEdge
          source={source}
          target={target}
          targetMarkerId={hover ? TARGET_ARROW_MARKER_HOVER_ID : TARGET_ARROW_MARKER_ID}
          isDragging={isDragging}
          isHover={hover}
        />
        <path
          d={`M ${lineBox[0]} L ${lineBox[1]} L ${lineBox[2]} L ${lineBox[3]} Z`}
          fillOpacity={0}
        />
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
    </React.Fragment>
  );
};

export default ConnectsTo;
