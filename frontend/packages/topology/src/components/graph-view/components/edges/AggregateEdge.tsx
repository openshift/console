import * as React from 'react';
import { Edge, EdgeTerminalType, observer } from '@patternfly/react-topology';
import BaseEdge from './BaseEdge';

import './AggregateEdge.scss';

type AggregateEdgeProps = {
  element: Edge;
};

const AggregateEdge: React.FC<AggregateEdgeProps> = ({ element, ...others }) => {
  const { bidirectional } = element.getData();

  const endTerminalType =
    !bidirectional && (!element.getSource().isCollapsed() || !element.getTarget().isCollapsed())
      ? EdgeTerminalType.directional
      : EdgeTerminalType.none;

  return (
    <BaseEdge
      data-test-id="edge-handler"
      element={element}
      className="odc-base-edge odc-aggregate-edge"
      endTerminalType={endTerminalType}
      {...others}
    />
  );
};

export default observer(AggregateEdge);
