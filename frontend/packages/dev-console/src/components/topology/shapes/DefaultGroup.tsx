import * as React from 'react';
import * as classNames from 'classnames';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { pointInSvgPath } from 'point-in-svg-path';
import { GroupElementInterface, GroupProps, ViewNode } from '../topology-types';
import SvgBoxedText from '../../svg/SvgBoxedText';
import { hullPath, Point } from '../../../utils/svg-utils';

import './DefaultGroup.scss';

type PointWithSize = Point & [number, number, number];

// Return the point whose Y is the largest value.
function findLowestPoint<P extends Point>(points: P[]): P {
  let lowestPoint = points[0];

  _.forEach(points, (p) => {
    if (p[1] > lowestPoint[1]) {
      lowestPoint = p;
    }
  });

  return _.clone(lowestPoint);
}

const hullPadding = (point: PointWithSize) => point[2] + 40;

interface DefaultGroupState {
  nodes: ViewNode[];
  lowestPoint: PointWithSize;
  containerPath: string;
}

const getUpdatedStateValues = (nodes: ViewNode[]) => {
  // convert nodes to points
  const points: PointWithSize[] = new Array(nodes.length);
  _.forEach(nodes, (node, i) => {
    points[i] = [node.x, node.y, node.size / 2] as PointWithSize;
  });

  // Get the convex hull of all points.
  const hullPoints: Point[] = points.length > 2 ? d3.polygonHull(points) : points;
  const containerPath = hullPath(hullPoints, hullPadding);

  // Find the lowest point of the set in order to place the group label.
  const lowestPoint = findLowestPoint(points);

  return {
    nodes: _.cloneDeep(nodes),
    lowestPoint,
    containerPath,
  };
};

class DefaultGroup extends React.Component<GroupProps, DefaultGroupState>
  implements GroupElementInterface {
  constructor(props: GroupProps) {
    super(props);

    this.state = getUpdatedStateValues(props.nodes);
    if (props.groupRef) {
      props.groupRef(this);
    }
  }

  static getDerivedStateFromProps(nextProps: GroupProps, prevState: DefaultGroupState) {
    if (nextProps.dropSource || nextProps.nodes.length === 0) {
      return null;
    }

    if (!_.isEqual(nextProps.nodes, prevState.nodes)) {
      return getUpdatedStateValues(nextProps.nodes);
    }

    return null;
  }

  public isPointInGroup = (point: Point): boolean => {
    const { containerPath } = this.state;
    return pointInSvgPath(containerPath, point[0], point[1]);
  };

  render() {
    const { name, dropTarget } = this.props;
    const { nodes, lowestPoint, containerPath } = this.state;

    if (nodes.length === 0) {
      return null;
    }

    const pathClasses = classNames('odc-default-group', { 'is-highlight': dropTarget });
    return (
      <g>
        <path d={containerPath} className={pathClasses} />
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
  }
}

export default DefaultGroup;
