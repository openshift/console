import * as React from 'react';
import * as classNames from 'classnames';
import { createSvgIdUrl } from '@console/topology';
import { ViewNode } from '../../topology2/topology-types';

import './BaseEdge.scss';

type BaseEdgeProps = {
  source: ViewNode;
  target: ViewNode;
  sourceMarkerId?: string;
  targetMarkerId?: string;
  isDragging?: boolean;
  isHover?: boolean;
};

const BaseEdge: React.SFC<BaseEdgeProps> = ({
  source,
  target,
  sourceMarkerId,
  targetMarkerId,
  isDragging,
  isHover,
}) => (
  <line
    className={classNames('odc-base-edge', {
      'is-highlight': isDragging,
      'is-hover': isHover,
    })}
    x1={source.x}
    y1={source.y}
    x2={target.x}
    y2={target.y}
    markerStart={sourceMarkerId ? createSvgIdUrl(sourceMarkerId) : undefined}
    markerEnd={targetMarkerId ? createSvgIdUrl(targetMarkerId) : undefined}
  />
);

export default BaseEdge;
