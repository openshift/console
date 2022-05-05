import * as React from 'react';
import {
  Edge,
  EdgeTerminalType,
  observer,
  WithContextMenuProps,
  WithSourceDragProps,
  WithTargetDragProps,
} from '@patternfly/react-topology';
import { BaseEdge } from '@console/topology/src/components/graph-view';
import { getTopologyResourceObject } from '@console/topology/src/utils';
import { EventingBrokerModel } from '../../../models';
import { EVENT_MARKER_RADIUS } from '../../const';

type EventingPubSubLinkProps = {
  element: Edge;
  dragging: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithContextMenuProps;

const EventingPubSubLink: React.FC<EventingPubSubLinkProps> = ({
  element,
  children,
  ...others
}) => {
  const resourceSourceObj = getTopologyResourceObject(element.getSource().getData());
  const edgeObj = getTopologyResourceObject(element.getData());
  const edgeHasFilter =
    resourceSourceObj.kind === EventingBrokerModel.kind &&
    Object.keys(edgeObj?.spec?.filter?.attributes ?? {}).length > 0;

  let filterMarker: JSX.Element;
  if (edgeHasFilter) {
    const markerPoint = element.getEndPoint();
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
        transform={`translate(${markerPoint.x}, ${markerPoint.y}) rotate(${angleDeg})`}
      />
    );
  }

  return (
    <BaseEdge element={element} endTerminalType={EdgeTerminalType.circle} {...others}>
      {filterMarker}
    </BaseEdge>
  );
};

export default observer(EventingPubSubLink);
