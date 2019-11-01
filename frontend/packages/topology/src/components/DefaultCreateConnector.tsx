import * as React from 'react';
import { createSvgIdUrl } from '../utils/svg-utils';
import Point from '../geom/Point';
import SVGArrowMarker from './SVGArrowMarker';

import './DefaultCreateConnector.scss';

const TARGET_ARROW_MARKER_ID = 'DefaultCreateConnectorArrowMarker';

type DefaultCreateConnectorProps = {
  startPoint: Point;
  endPoint: Point;
};

const DefaultCreateConnector: React.FC<DefaultCreateConnectorProps> = ({
  startPoint,
  endPoint,
}) => (
  <>
    <SVGArrowMarker
      id={TARGET_ARROW_MARKER_ID}
      nodeSize={-5}
      markerSize={12}
      className="topology-default-create-connector__marker"
    />
    <line
      strokeWidth="2px"
      strokeDasharray="5px, 5px"
      stroke="var(--pf-global--active-color--400)"
      x1={startPoint.x}
      y1={startPoint.y}
      x2={endPoint.x}
      y2={endPoint.y}
      markerEnd={createSvgIdUrl(TARGET_ARROW_MARKER_ID)}
    />
  </>
);

export default DefaultCreateConnector;
