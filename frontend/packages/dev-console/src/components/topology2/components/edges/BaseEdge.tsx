import * as React from 'react';
import * as classNames from 'classnames';
import { Layer, Edge, WithRemoveConnectorProps, observer, useHover } from '@console/topology';
import './BaseEdge.scss';

type BaseEdgeProps = {
  element: Edge;
  dragging?: boolean;
  className?: string;
} & WithRemoveConnectorProps;

const BaseEdge: React.FC<BaseEdgeProps> = ({
  element,
  dragging,
  onShowRemoveConnector,
  onHideRemoveConnector,
  children,
  className,
}) => {
  const [hover, hoverRef] = useHover();
  const startPoint = element.getStartPoint();
  const endPoint = element.getEndPoint();

  React.useLayoutEffect(() => {
    if (hover && !dragging) {
      onShowRemoveConnector && onShowRemoveConnector();
    } else {
      onHideRemoveConnector && onHideRemoveConnector();
    }
  }, [hover, dragging, onShowRemoveConnector, onHideRemoveConnector]);

  return (
    <Layer id={dragging || hover ? 'top' : undefined}>
      <g
        ref={hoverRef}
        data-test-id="edge-handler"
        className={classNames(className, 'odc2-base-edge', {
          'is-highlight': dragging,
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
          className="odc2-base-edge__link"
          x1={startPoint.x}
          y1={startPoint.y}
          x2={endPoint.x}
          y2={endPoint.y}
        />
        {children}
      </g>
    </Layer>
  );
};

export default observer(BaseEdge);
