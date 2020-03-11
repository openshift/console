import * as React from 'react';
import { polygonHull } from 'd3-polygon';
import * as _ from 'lodash';
import {
  Layer,
  Node,
  PointTuple,
  NodeShape,
  NodeStyle,
  maxPadding,
  observer,
  useCombineRefs,
  useHover,
  useDragNode,
  WithDndDropProps,
  WithSelectionProps,
  WithContextMenuProps,
  createSvgIdUrl,
  hullPath,
} from '@console/topology';
import * as classNames from 'classnames';
import { useSearchFilter } from '../../filters/useSearchFilter';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import { NodeShadows, NODE_SHADOW_FILTER_ID, NODE_SHADOW_FILTER_ID_HOVER } from '../NodeShadows';

type ApplicationGroupProps = {
  element: Node;
  droppable?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  dragging?: boolean;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps;

type PointWithSize = [number, number, number];

// Return the point whose Y is the largest value.
// If multiple points are found, compute the center X between them
// export for testing only
export function computeLabelLocation(points: PointWithSize[]): PointWithSize {
  let lowPoints: PointWithSize[];
  const threshold = 5;

  _.forEach(points, (p) => {
    const delta = !lowPoints ? Infinity : Math.round(p[1]) - Math.round(lowPoints[0][1]);
    if (delta > threshold) {
      lowPoints = [p];
    } else if (Math.abs(delta) <= threshold) {
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
  dndDropRef,
  droppable,
  canDrop,
  dropTarget,
  onContextMenu,
  contextMenuOpen,
  dragging,
}) => {
  const [hover, hoverRef] = useHover();
  const [labelHover, labelHoverRef] = useHover();
  const labelLocation = React.useRef<PointWithSize>();
  const pathRef = React.useRef<string>();
  const dragNodeRef = useDragNode()[1];
  const dragLabelRef = useDragNode()[1];
  const refs = useCombineRefs<SVGPathElement>(hoverRef, dragNodeRef);
  const [filtered] = useSearchFilter(element.getLabel());

  // cast to number and coerce
  const padding = maxPadding(element.getStyle<NodeStyle>().padding);
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

  return (
    <g
      ref={labelHoverRef}
      onContextMenu={onContextMenu}
      onClick={onSelect}
      className={classNames('odc-application-group', {
        'is-dragging': dragging,
        'is-highlight': canDrop,
        'is-filtered': filtered,
      })}
    >
      <NodeShadows />
      <Layer id="groups">
        <g
          ref={refs}
          onContextMenu={onContextMenu}
          onClick={onSelect}
          className={classNames('odc-application-group', {
            'is-dragging': dragging,
            'is-highlight': canDrop,
            'is-selected': selected,
            'is-dropTarget': canDrop && dropTarget,
            'is-filtered': filtered,
          })}
        >
          <path
            ref={dndDropRef}
            className="odc-application-group__bg"
            filter={createSvgIdUrl(
              hover || labelHover || dragging || contextMenuOpen || dropTarget
                ? NODE_SHADOW_FILTER_ID_HOVER
                : NODE_SHADOW_FILTER_ID,
            )}
            d={pathRef.current}
          />
        </g>
      </Layer>
      <SvgBoxedText
        className="odc-application-group__label"
        kind="application"
        x={labelLocation.current[0]}
        y={labelLocation.current[1] + hullPadding(labelLocation.current) + 24}
        paddingX={8}
        paddingY={5}
        dragRef={dragLabelRef}
      >
        {element.getLabel()}
      </SvgBoxedText>
    </g>
  );
};

export default observer(ApplicationGroup);
