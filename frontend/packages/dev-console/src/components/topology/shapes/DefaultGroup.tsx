import * as React from 'react';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { GroupProps } from '../topology-types';
import SvgBoxedText from '../../svg/SvgBoxedText';
import { hullPath } from '../../../utils/svg-utils';

import './DefaultGroup.scss';

type Point = [number, number];
type PointWithSize = Point & [number, number, number];

// Return the point whose Y is the largest value.
function findLowestPoint<P extends Point>(points: P[]): P {
  let lowestPoint = points[0];

  _.forEach(points, (p) => {
    if (p[1] > lowestPoint[1]) {
      lowestPoint = p;
    }
  });

  return lowestPoint;
}

const hullPadding = (point: PointWithSize) => point[2] + 40;

const DefaultGroup: React.FC<GroupProps> = ({ name, nodes }) => {
  if (nodes.length === 0) {
    return null;
  }

  // convert nodes to points
  const points: PointWithSize[] = new Array(nodes.length);
  _.forEach(nodes, (node, i) => {
    points[i] = [node.x, node.y, node.size / 2] as PointWithSize;
  });

  // Get the convex hull of all points.
  const d = hullPath(points.length > 2 ? d3.polygonHull(points) : points, hullPadding);

  // Find the lowest point of the set in order to place the group label.
  const lowestPoint = findLowestPoint(points);

  return (
    <g>
      <path d={d} className="odc-default-group" />
      <SvgBoxedText
        className="odc-default-group__label"
        x={lowestPoint[0]}
        y={lowestPoint[1] + hullPadding(lowestPoint) + 30}
        paddingX={20}
        paddingY={5}
      >
        {name}
      </SvgBoxedText>
    </g>
  );
};

export default DefaultGroup;
