import * as React from 'react';
import { observer } from 'mobx-react';
import { Edge } from '../types';
import DefaultRemoveConnector from '../components/DefaultRemoveConnector';
import useCallbackRef from '../utils/useCallbackRef';
import Point from '../geom/Point';

type ElementProps = {
  element: Edge;
};

export type WithRemoveConnectorProps = {
  onShowRemoveConnector?: () => void;
  onHideRemoveConnector?: () => void;
  removeEdgeRef?: (svgElement: SVGElement) => void;
};

type RemoveRenderer = (
  edge: Edge,
  onRemove: (edge: Edge) => void,
  startPoint?: Point,
  endPoint?: Point,
  size?: number,
) => React.ReactElement;

const defaultRenderRemove: RemoveRenderer = (
  edge: Edge,
  onRemove: (edge: Edge) => void,
  startPoint: Point,
  endPoint: Point,
) => {
  const removeEdge = () => {
    onRemove(edge);
  };

  return (
    <DefaultRemoveConnector
      startPoint={startPoint || edge.getStartPoint()}
      endPoint={endPoint || edge.getEndPoint()}
      onRemove={removeEdge}
    />
  );
};

export const withRemoveConnector = <P extends WithRemoveConnectorProps & ElementProps>(
  onRemove: (edge: Edge) => void,
  renderRemove: RemoveRenderer = defaultRenderRemove,
) => (WrappedComponent: React.ComponentType<P>) => {
  const Component: React.FC<Omit<P, keyof WithRemoveConnectorProps>> = (props) => {
    const [show, setShow] = React.useState(false);
    const [startPoint, setStartPoint] = React.useState<Point | undefined>(undefined);
    const [endPoint, setEndPoint] = React.useState<Point | undefined>(undefined);
    const onShowRemoveConnector = React.useCallback(() => setShow(true), []);
    const onHideRemoveConnector = React.useCallback(() => setShow(false), []);

    const removeEdgeRef = useCallbackRef(
      React.useCallback((node: SVGElement | null) => {
        if (node instanceof SVGPathElement) {
          const pathLength = node.getTotalLength();
          const point = node.getPointAtLength(pathLength / 2);
          setStartPoint(new Point(point.x, point.y));
          setEndPoint(new Point(point.x, point.y));
        }
        if (node instanceof SVGLineElement) {
          const start = new Point(node.x1.baseVal.value, node.y1.baseVal.value);
          const end = new Point(node.x2.baseVal.value, node.y2.baseVal.value);
          setStartPoint(start);
          setEndPoint(end);
        }
      }, []),
    );

    return (
      <WrappedComponent
        {...(props as any)}
        onShowRemoveConnector={onShowRemoveConnector}
        onHideRemoveConnector={onHideRemoveConnector}
        removeEdgeRef={removeEdgeRef}
      >
        {show && renderRemove(props.element, onRemove, startPoint, endPoint)}
      </WrappedComponent>
    );
  };
  return observer(Component);
};
