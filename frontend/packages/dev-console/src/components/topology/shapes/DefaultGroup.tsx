import * as React from 'react';
import * as classNames from 'classnames';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { pointInSvgPath } from 'point-in-svg-path';
import { createSvgIdUrl, hullPath, PointTuple } from '@console/topology';
import { GroupElementInterface, GroupProps, ViewNode } from '../../topology2/topology-types';
import SvgBoxedText from '../../svg/SvgBoxedText';
import SvgDropShadowFilter from '../../svg/SvgDropShadowFilter';

import './DefaultGroup.scss';

const FILTER_ID = 'DefaultGroupShadowFilterId';
const FILTER_ID_HOVER = 'DefaultGroupDropShadowFilterId--hover';

type PointWithSize = PointTuple & [number, number, number];

// Return the point whose Y is the largest value.
function findLowestPoint<P extends PointTuple>(points: P[]): P {
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
  isHover?: boolean;
}

const getUpdatedStateValues = (nodes: ViewNode[]) => {
  // convert nodes to points
  const points: PointWithSize[] = new Array(nodes.length);
  _.forEach(nodes, (node, i) => {
    points[i] = [node.x, node.y, node.size / 2] as PointWithSize;
  });

  // Get the convex hull of all points.
  const hullPoints: PointTuple[] = points.length > 2 ? d3.polygonHull(points) : points;
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

  public isPointInGroup = (point: PointTuple): boolean => {
    const { containerPath } = this.state;
    return pointInSvgPath(containerPath, point[0], point[1]);
  };

  setHover = (isHover: boolean) => {
    this.setState({ isHover });
  };

  handleClick = (e: React.MouseEvent<SVGGElement, MouseEvent>) => {
    const { onSelect } = this.props;
    e.stopPropagation();
    onSelect();
  };

  render() {
    const { name, dropTarget, selected, onSelect, dragActive } = this.props;
    const { nodes, lowestPoint, containerPath, isHover } = this.state;

    if (nodes.length === 0) {
      return null;
    }

    const pathClasses = classNames('odc-default-group', {
      'is-highlight': dropTarget,
      'is-selected': selected,
      'is-hover': isHover,
    });
    return (
      <g>
        <SvgDropShadowFilter id={FILTER_ID} />
        <SvgDropShadowFilter id={FILTER_ID_HOVER} dy={3} stdDeviation={7} floodOpacity={0.24} />
        <g
          onClick={onSelect ? this.handleClick : null}
          onMouseEnter={() => this.setHover(true)}
          onMouseLeave={() => this.setHover(false)}
          filter={
            isHover && !dragActive ? createSvgIdUrl(FILTER_ID_HOVER) : createSvgIdUrl(FILTER_ID)
          }
        >
          <path d={containerPath} className={pathClasses} />
        </g>
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

export default React.memo(DefaultGroup);
