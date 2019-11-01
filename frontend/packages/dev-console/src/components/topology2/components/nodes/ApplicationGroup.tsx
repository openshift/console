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
import SvgDropShadowFilter from '../../../svg/SvgDropShadowFilter';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import './ApplicationGroup.scss';

type ApplicationGroupProps = {
  element: Node;
  droppable?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps;

const FILTER_ID = 'ApplicationGroupShadowFilterId';
const FILTER_ID_HOVER = 'ApplicationGroupDropShadowFilterId--hover';

type PointWithSize = PointTuple | [number, number, number];

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
}) => {
  const [groupHover, groupHoverRef] = useHover();
  const [groupLabelHover, groupLabelHoverRef] = useHover();
  const [lowPoint, setLowPoint] = React.useState<[number, number]>([0, 0]);
  const pathRef = React.useRef<string | null>(null);
  const refs = useCombineRefs<SVGPathElement>(dragNodeRef, dndDropRef);

  const hover = groupHover || groupLabelHover;

  // cast to number and coerce
  const padding = maxPadding(element.getStyle<GroupStyle>().padding);
  const hullPadding = (point: PointWithSize) => (point[2] || 0) + padding;

  if (!droppable || !pathRef.current) {
    const children = element.getNodes();
    if (children.length === 0) {
      return null;
    }
    const points: PointWithSize[] = [];
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
    const hullPoints: PointTuple[] | null =
      points.length > 2 ? polygonHull(points as PointTuple[]) : (points as PointTuple[]);
    if (!hullPoints) {
      return null;
    }

    // change the box only when not dragging
    pathRef.current = hullPath(hullPoints, hullPadding);

    // Find the lowest point of the set in order to place the group label.
    const lowestPoint = findLowestPoint(hullPoints);
    if (lowestPoint[0] !== lowPoint[0] || lowestPoint[1] !== lowPoint[1]) {
      setLowPoint(findLowestPoint(hullPoints));
    }
  }

  const pathClasses = classNames('odc2-application-group', {
    'is-highlight': canDrop,
    'is-selected': selected,
    'is-hover': hover || (canDrop && dropTarget),
  });

  return (
    <>
      <SvgDropShadowFilter id={FILTER_ID} />
      <SvgDropShadowFilter id={FILTER_ID_HOVER} dy={3} stdDeviation={7} floodOpacity={0.24} />
      <Layer id="groups">
        <g ref={groupHoverRef} onContextMenu={onContextMenu} onClick={onSelect}>
          <path
            ref={refs}
            filter={hover ? createSvgIdUrl(FILTER_ID_HOVER) : createSvgIdUrl(FILTER_ID)}
            className={pathClasses}
            d={pathRef.current}
          />
        </g>
      </Layer>
      <g ref={groupLabelHoverRef} onContextMenu={onContextMenu} onClick={onSelect}>
        <SvgBoxedText
          className="odc2-application-group__label"
          x={lowPoint[0]}
          y={lowPoint[1] + hullPadding(lowPoint) + 30}
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
