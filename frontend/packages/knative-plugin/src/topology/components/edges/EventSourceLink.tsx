import * as React from 'react';
import {
  Edge,
  observer,
  WithSourceDragProps,
  WithTargetDragProps,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { BaseEdge } from '@console/topology/src/components/graph-view';
import { getResource } from '@console/topology/src/utils';
import { EVENT_MARKER_RADIUS } from '../../const';
import './EventSourceLink.scss';

type EventSourceLinkProps = {
  element: Edge;
  dragging: boolean;
} & WithSourceDragProps &
  WithTargetDragProps;

const EventSourceLink: React.FC<EventSourceLinkProps> = ({
  element,
  targetDragRef,
  children,
  ...others
}) => {
  const resourceObj = getResource(element.getSource());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'update',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  const markerPoint = element.getEndPoint();
  const edgeClasses = classNames('odc-event-source-link', { 'odc-m-editable': editAccess });
  return (
    <BaseEdge className={edgeClasses} element={element} {...others}>
      <circle
        className="topology-connector-arrow"
        ref={editAccess ? targetDragRef : null}
        cx={markerPoint.x}
        cy={markerPoint.y}
        r={EVENT_MARKER_RADIUS}
      />
    </BaseEdge>
  );
};

export default observer(EventSourceLink);
