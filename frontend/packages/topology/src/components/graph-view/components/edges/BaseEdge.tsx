import * as React from 'react';
import {
  Layer,
  Edge,
  WithRemoveConnectorProps,
  observer,
  useHover,
  useSelection,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { useAccessReview } from '@console/internal/components/utils';
import { referenceFor, modelFor } from '@console/internal/module/k8s';
import { getResource } from '../../../../utils/topology-utils';
import './BaseEdge.scss';

type BaseEdgeProps = {
  element: Edge;
  dragging?: boolean;
  className?: string;
} & WithRemoveConnectorProps &
  Partial<WithContextMenuProps>;

const BaseEdge: React.FC<BaseEdgeProps> = ({
  element,
  dragging,
  onShowRemoveConnector,
  onHideRemoveConnector,
  children,
  className,
  onContextMenu,
}) => {
  const [hover, hoverRef] = useHover();
  const [selected, onSelect] = useSelection({ controlled: true });
  const startPoint = element.getStartPoint();
  const endPoint = element.getEndPoint();
  const resourceObj = getResource(element.getSource());
  const resourceModel = resourceObj && modelFor(referenceFor(resourceObj));

  const editAccess = useAccessReview({
    group: resourceModel?.apiGroup,
    verb: 'patch',
    resource: resourceModel?.plural,
    name: resourceObj?.metadata.name,
    namespace: resourceObj?.metadata.namespace,
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

  return (
    <Layer id={dragging || hover ? 'top' : undefined}>
      <g
        ref={hoverRef}
        data-test-id="edge-handler"
        className={classNames(className, 'odc-base-edge', {
          'is-dragging': dragging,
          'is-hover': hover,
          'is-selected': selected,
        })}
        onClick={onSelect}
        onContextMenu={onContextMenu}
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
        {children}
      </g>
    </Layer>
  );
};

export default observer(BaseEdge);
