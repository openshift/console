import * as React from 'react';
import * as classNames from 'classnames';
import { Edge, Layer, useHover, EdgeConnectorArrow, observer } from '@patternfly/react-topology';

import './AggregateEdge.scss';

type AggregateEdgeProps = {
  element: Edge;
};

const ObservedAggregateEdge: React.FC<AggregateEdgeProps> = ({ element }) => {
  const [hover, hoverRef] = useHover();
  const startPoint = element.getStartPoint();
  const endPoint = element.getEndPoint();
  const { bidirectional } = element.getData();

  return (
    <Layer id={hover ? 'top' : undefined}>
      <g
        ref={hoverRef}
        data-test-id="edge-handler"
        className={classNames('odc-base-edge odc-aggregate-edge', {
          'is-hover': hover,
        })}
      >
        <line
          x1={startPoint.x}
          y1={startPoint.y}
          x2={endPoint.x}
          y2={endPoint.y}
          strokeWidth={10}
          stroke="transparent"
        />
        <line
          className="odc-base-edge__link"
          x1={startPoint.x}
          y1={startPoint.y}
          x2={endPoint.x}
          y2={endPoint.y}
        />
        {!bidirectional &&
          (!element.getSource().isCollapsed() || !element.getTarget().isCollapsed()) && (
            <EdgeConnectorArrow edge={element} />
          )}
      </g>
    </Layer>
  );
};

const AggregateEdge = observer(ObservedAggregateEdge);
export { AggregateEdge };
