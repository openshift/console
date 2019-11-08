import * as React from 'react';
import { polygonHull } from 'd3-polygon';
import * as _ from 'lodash';
import {
  Layer,
  Node,
  PointTuple,
  NodeShape,
  GroupStyle,
  maxPadding,
  observer,
  useCombineRefs,
  useHover,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
  WithContextMenuProps,
  createSvgIdUrl,
  hullPath,
} from '@console/topology';
import * as classNames from 'classnames';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import NodeShadows, { NODE_SHADOW_FILTER_ID, NODE_SHADOW_FILTER_ID_HOVER } from '../NodeShadows';

import './ApplicationGroup.scss';

type ApplicationGroupProps = {
  element: Node;
  droppable?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  dragging?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps;

type PointWithSize = [number, number, number];

// Return the point whose Y is the largest value.
// If multiple points are found, compute the center X between them
// export for testing only
export function computeLabelLocation(points: PointWithSize[]): PointWithSize {
  let lowPoints: PointWithSize[];

  _.forEach(points, (p) => {
    if (!lowPoints || p[1] > lowPoints[0][1]) {
      lowPoints = [p];
    } else if (p[1] === lowPoints[0][1]) {
      lowPoints.push(p);
    }
  });

  return [
    (_.minBy(lowPoints, (p) => p[0])[0] + _.maxBy(lowPoints, (p) => p[0])[0]) / 2,
    lowPoints[0][1],
    // use the max size value
    _.maxBy(lowPoints, (p) => p[2])[2],
  ];
}

const ApplicationGroup: React.FC<ApplicationGroupProps> = ({
  element,
  selected,
  onSelect,
  dragNodeRef,
  dndDropRef,
  droppable,
  canDrop,
  dropTarget,
  onContextMenu,
  dragging,
}) => {
  const [groupHover, groupHoverRef] = useHover();
  const [groupLabelHover, groupLabelHoverRef] = useHover();
  const labelLocation = React.useRef<PointWithSize>();
  const pathRef = React.useRef<string>();
  const refs = useCombineRefs<SVGPathElement>(dragNodeRef, dndDropRef);

  const hover = groupHover || groupLabelHover;

  // cast to number and coerce
  const padding = maxPadding(element.getStyle<GroupStyle>().padding);
  const hullPadding = (point: PointWithSize | PointTuple) => (point[2] || 0) + padding;

  if (!droppable || !pathRef.current || !labelLocation.current) {
    const children = element.getNodes();
    if (children.length === 0) {
      return null;
    }
    const points: (PointWithSize | PointTuple)[] = [];
    _.forEach(children, (c) => {
      if (c.getNodeShape() === NodeShape.circle) {
        const { width, height } = c.getBounds();
        const { x, y } = c.getBounds().getCenter();
        const radius = Math.max(width, height) / 2;
        points.push([x, y, radius] as PointWithSize);
      } else {
        // add all 4 corners
        const { width, height, x, y } = c.getBounds();
        points.push([x, y, 0] as PointWithSize);
        points.push([x + width, y, 0] as PointWithSize);
        points.push([x, y + height, 0] as PointWithSize);
        points.push([x + width, y + height, 0] as PointWithSize);
      }
    });
    const hullPoints: (PointWithSize | PointTuple)[] =
      points.length > 2 ? polygonHull(points as PointTuple[]) : (points as PointTuple[]);
    if (!hullPoints) {
      return null;
    }

    // change the box only when not dragging
    pathRef.current = hullPath(hullPoints as PointTuple[], hullPadding);

    // Compute the location of the group label.
    labelLocation.current = computeLabelLocation(hullPoints as PointWithSize[]);
  }

  const pathClasses = classNames('odc2-application-group', {
    'is-highlight': canDrop,
    'is-selected': selected,
    'is-hover': hover || (canDrop && dropTarget),
  });

  return (
    <>
      <NodeShadows />
      <Layer id="groups">
        <g ref={groupHoverRef} onContextMenu={onContextMenu} onClick={onSelect}>
          <path
            ref={refs}
            filter={createSvgIdUrl(
              hover || dragging ? NODE_SHADOW_FILTER_ID_HOVER : NODE_SHADOW_FILTER_ID,
            )}
            className={pathClasses}
            d={pathRef.current}
          />
        </g>
      </Layer>
      <g ref={groupLabelHoverRef} onContextMenu={onContextMenu} onClick={onSelect}>
        <SvgBoxedText
          className="odc2-application-group__label"
          x={labelLocation.current[0]}
          y={labelLocation.current[1] + hullPadding(labelLocation.current) + 30}
          paddingX={20}
          paddingY={5}
          truncate={16}
        >
          {element.getLabel()}
        </SvgBoxedText>
      </g>
    </>
  );
};

export default observer(ApplicationGroup);
