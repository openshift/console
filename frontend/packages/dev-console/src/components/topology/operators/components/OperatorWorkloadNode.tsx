import * as React from 'react';
import {
  observer,
  Node,
  WithCreateConnectorProps,
  WithDragNodeProps,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  useDndDrop,
} from '@patternfly/react-topology';
import { WorkloadNode } from '../../components/nodes';
import { nodeDropTargetSpec } from '../../components';

export type OperatorWorkloadNodeProps = {
  element: Node;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const OperatorWorkloadNode: React.FC<OperatorWorkloadNodeProps> = observer((props) => {
  const [dndDropProps, dndDropRef] = useDndDrop(nodeDropTargetSpec, props);
  return <WorkloadNode {...props} dndDropRef={dndDropRef} {...dndDropProps} />;
});

export { OperatorWorkloadNode };
