import * as React from 'react';
import {
  Edge,
  observer,
  WithSourceDragProps,
  WithTargetDragProps,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import classnames from 'classnames';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { BaseEdge } from '@console/topology/src/components/graph-view';
import { getTopologyResourceObject } from '@console/topology/src/utils';
import { EventingBrokerModel } from '../../../models';
import { EVENT_MARKER_RADIUS } from '../../const';

import './EventingPubSubLink.scss';

type EventingPubSubLinkProps = {
  element: Edge;
  dragging: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithContextMenuProps;

const EventingPubSubLink: React.FC<EventingPubSubLinkProps> = ({
  element,
  targetDragRef,
  children,
  ...others
}) => {
  const resourceSourceObj = getTopologyResourceObject(element.getSource().getData());
  const edgeObj = getTopologyResourceObject(element.getData());
  const edgeHasFilter =
    resourceSourceObj.kind === EventingBrokerModel.kind &&
    Object.keys(edgeObj?.spec?.filter?.attributes ?? {}).length > 0;
  const resourceModel = modelFor(referenceFor(edgeObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'update',
    resource: resourceModel.plural,
    name: edgeObj.metadata.name,
    namespace: edgeObj.metadata.namespace,
  });
  const markerPoint = element.getEndPoint();
  const edgeClasses = classnames('odc-eventing-pubsub-link', { 'odc-m-editable': editAccess });

  let filterMarker: JSX.Element;
  if (edgeHasFilter) {
    const startPoint = element.getStartPoint();
    const x = -EVENT_MARKER_RADIUS - 5;
    const y = EVENT_MARKER_RADIUS;
    const angleDeg =
      180 -
      (Math.atan2(markerPoint.y - startPoint.y, startPoint.x - markerPoint.x) * 180) / Math.PI;
    filterMarker = (
      <line
        className="odc-base-edge__link"
        x1={x}
        y1={-y}
        x2={x}
        y2={y}
        stroke="var(--pf-global--BorderColor--light-100)"
        transform={`translate(${markerPoint.x}, ${markerPoint.y}) rotate(${angleDeg})`}
      />
    );
  }

  return (
    <BaseEdge className={edgeClasses} element={element} {...others}>
      {filterMarker}
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
