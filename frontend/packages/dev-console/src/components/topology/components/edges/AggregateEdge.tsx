import * as React from 'react';
import * as classNames from 'classnames';
import { Edge, Layer, Point, useHover, EdgeConnectorArrow, observer } from '@console/topology';
import { renderPoints } from './BaseEdge';

type AggregateEdgeProps = {
  element: Edge;
};

const AggregateEdge: React.FC<AggregateEdgeProps> = ({ element }) => {
  const [hover, hoverRef] = useHover();
  const startPoint = element.getStartPoint();
  const endPoint = element.getEndPoint();
  const bendpoints = element.getBendpoints();

  const d = `M${startPoint.x} ${startPoint.y} ${bendpoints
    .map((b: Point) => `L${b.x} ${b.y} `)
    .join('')}L${endPoint.x} ${endPoint.y}`;

  const points = [startPoint, ...bendpoints, endPoint];

  return (
    <Layer id={hover ? 'top' : undefined}>
      <path d={d} strokeWidth={0} stroke="transparent" fillOpacity={0} />
      <g
        ref={hoverRef}
        data-test-id="edge-handler"
        className={classNames('odc-connects-to odc-base-edge', {
          'is-hover': hover,
        })}
      >
        {renderPoints(points)}
        {(!element.getSource().isCollapsed() || !element.getTarget().isCollapsed()) && (
          <EdgeConnectorArrow edge={element} />
        )}
      </g>
    </Layer>
  );
};

export default observer(AggregateEdge);
