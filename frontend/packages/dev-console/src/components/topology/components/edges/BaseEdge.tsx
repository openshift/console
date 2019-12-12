import * as React from 'react';
import * as classNames from 'classnames';
import { referenceFor, modelFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import {
  Layer,
  Edge,
  Point,
  WithRemoveConnectorProps,
  observer,
  useHover,
} from '@console/topology';
import { getTopologyResourceObject } from '../../topology-utils';
import './BaseEdge.scss';

type BaseEdgeProps = {
  element: Edge;
  dragging?: boolean;
  className?: string;
} & WithRemoveConnectorProps;

const renderSegment = (startPoint: Point, endPoint: Point, index: number): React.ReactNode => (
  <React.Fragment key={index}>
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
  </React.Fragment>
);

const renderPoints = (points: Point[]): React.ReactNode => {
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push([points[i], points[i + 1]]);
  }
  return <>{segments.map((segment, index) => renderSegment(segment[0], segment[1], index))}</>;
};

const BaseEdge: React.FC<BaseEdgeProps> = ({
  element,
  dragging,
  onShowRemoveConnector,
  onHideRemoveConnector,
  removeEdgeRef,
  children,
  className,
}) => {
  const [hover, hoverRef] = useHover();
  const startPoint = element.getStartPoint();
  const endPoint = element.getEndPoint();
  const bendpoints = element.getBendpoints();
  const resourceObj = getTopologyResourceObject(element.getSource().getData());
  const resourceModel = modelFor(referenceFor(resourceObj));

  const editAccess = useAccessReview({
    group: resourceModel && resourceModel.apiGroup,
    verb: 'patch',
    resource: resourceModel && resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });

  React.useLayoutEffect(() => {
    if (editAccess) {
      if (hover && !dragging) {
        onShowRemoveConnector && onShowRemoveConnector();
      } else {
        onHideRemoveConnector && onHideRemoveConnector();
      }
    }
  }, [hover, dragging, onShowRemoveConnector, onHideRemoveConnector, editAccess]);

  const d = `M${startPoint.x} ${startPoint.y} ${bendpoints
    .map((b: Point) => `L${b.x} ${b.y} `)
    .join('')}L${endPoint.x} ${endPoint.y}`;

  const points = [startPoint, ...bendpoints, endPoint];

  return (
    <Layer id={dragging || hover ? 'top' : undefined}>
      <path ref={removeEdgeRef} d={d} strokeWidth={0} stroke="transparent" fillOpacity={0} />
      <g
        ref={hoverRef}
        data-test-id="edge-handler"
        className={classNames(className, 'odc-base-edge', {
          'is-highlight': dragging,
          'is-hover': hover,
        })}
      >
        {renderPoints(points)}
        {children}
      </g>
    </Layer>
  );
};

export default observer(BaseEdge);
