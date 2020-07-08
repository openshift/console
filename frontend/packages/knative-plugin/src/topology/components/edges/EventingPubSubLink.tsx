import * as React from 'react';
import * as classNames from 'classnames';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import {
  Edge,
  observer,
  WithSourceDragProps,
  WithTargetDragProps,
  getPathAlongTheLine,
} from '@console/topology';
import { getTopologyResourceObject, BaseEdge } from '@console/dev-console/src/components/topology';
import { EventingBrokerModel } from '@console/knative-plugin/src/models';
import { EVENT_MARKER_RADIUS } from '../../const';

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
  const edgeObj = getTopologyResourceObject(element.getData());
  const edgeHasFilter =
    resourceObj.kind === EventingBrokerModel.kind &&
    Object.keys(edgeObj?.spec?.filter?.attributes || {}).length > 0;
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'update',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  const startPoint = element.getStartPoint();
  const markerPoint = element.getEndPoint();
  const edgeClasses = classNames('odc-eventing-pubsub-link', { 'odc-m-editable': editAccess });
  return (
    <BaseEdge className={edgeClasses} element={element} {...others}>
      {edgeHasFilter && (
        <path
          className="odc-base-edge__link"
          d={getPathAlongTheLine(startPoint, markerPoint, 0.97)}
          stroke="var(--pf-global--BorderColor--light-100)"
          fill="none"
        />
      )}
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

export default observer(EventingPubSubLink);
