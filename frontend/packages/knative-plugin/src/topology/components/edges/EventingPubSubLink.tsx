import * as React from 'react';
import * as classNames from 'classnames';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import { Edge, observer, WithSourceDragProps, WithTargetDragProps } from '@console/topology';
import { getTopologyResourceObject, BaseEdge } from '@console/dev-console/src/components/topology';

import './EventingPubSubLink.scss';

type EventingPubSubLinkProps = {
  element: Edge;
  dragging: boolean;
} & WithSourceDragProps &
  WithTargetDragProps;

const EventingPubSubLink: React.FC<EventingPubSubLinkProps> = ({
  element,
  targetDragRef,
  children,
  ...others
}) => {
  const resourceObj = getTopologyResourceObject(element.getSource().getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'update',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  const markerPoint = element.getEndPoint();
  const edgeClasses = classNames('odc-eventing-pubsub-link', { 'odc-m-editable': editAccess });
  return (
    <BaseEdge className={edgeClasses} element={element} {...others}>
      <circle
        className="topology-connector-arrow"
        ref={editAccess ? targetDragRef : null}
        cx={markerPoint.x}
        cy={markerPoint.y}
        r={6}
      />
    </BaseEdge>
  );
};

export default observer(EventingPubSubLink);
