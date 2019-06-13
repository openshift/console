import * as React from 'react';
import { createSvgIdUrl } from '../../../utils/svg-utils';
import { ViewNode } from '../topology-types';

import './BaseEdge.scss';

type BaseEdgeProps = {
  source: ViewNode;
  target: ViewNode;
  sourceMarkerId?: string;
  targetMarkerId?: string;
};

const BaseEdge: React.SFC<BaseEdgeProps> = ({ source, target, sourceMarkerId, targetMarkerId }) => (
  <line
    className="odc-base-edge"
    x1={source.x}
    y1={source.y}
    x2={target.x}
    y2={target.y}
    markerStart={sourceMarkerId ? createSvgIdUrl(sourceMarkerId) : undefined}
    markerEnd={targetMarkerId ? createSvgIdUrl(targetMarkerId) : undefined}
  />
);

export default BaseEdge;
