import * as React from 'react';
import { connect } from 'react-redux';
import {
  Node,
  observer,
  WithSelectionProps,
  WithDndDropProps,
  DropTargetSpec,
  GraphElement,
  CREATE_CONNECTOR_DROP_TYPE,
  isEdge,
  useDndDrop,
} from '@patternfly/react-topology';
import { RootState } from '@console/internal/redux';
import {
  canDropEdgeOnNode,
  highlightNode,
  NodeComponentProps,
  nodesEdgeIsDragging,
} from '../../components';
import { getServiceBindingStatus } from '../../topology-utils';
import OperatorBackedServiceGroup from './OperatorBackedServiceGroup';
import OperatorBackedServiceNode from './OperatorBackedServiceNode';

import './OperatorBackedService.scss';

const obsDropTargetSpec = (
  serviceBinding: boolean,
): DropTargetSpec<
  GraphElement,
  any,
  { canDrop: boolean; dropTarget: boolean; edgeDragging: boolean },
  NodeComponentProps
> => ({
  accept: [CREATE_CONNECTOR_DROP_TYPE],
  canDrop: (item, monitor, props) => {
    if (!serviceBinding) {
      return false;
    }

    if (isEdge(item)) {
      return canDropEdgeOnNode(monitor.getOperation()?.type, item, props.element);
    }
    if (item === props.element) {
      return false;
    }
    return !props.element.getTargetEdges().find((e) => e.getSource() === item);
  },
  collect: (monitor, props) => {
    return {
      canDrop: serviceBinding && highlightNode(monitor, props.element),
      dropTarget: monitor.isOver({ shallow: true }),
      edgeDragging: nodesEdgeIsDragging(monitor, props),
    };
  },
  dropHint: 'createServiceBinding',
});

interface StateProps {
  serviceBinding: boolean;
}

export type OperatorBackedServiceProps = {
  element: Node;
} & WithSelectionProps &
  WithDndDropProps &
  StateProps;

const OperatorBackedService: React.FC<OperatorBackedServiceProps> = ({
  serviceBinding,
  ...rest
}) => {
  const spec = React.useMemo(() => obsDropTargetSpec(serviceBinding), [serviceBinding]);
  const [dndDropProps, dndDropRef] = useDndDrop(spec, rest as any);

  if (rest.element.isCollapsed()) {
    return <OperatorBackedServiceNode {...rest} dndDropRef={dndDropRef} {...dndDropProps} />;
  }

  return <OperatorBackedServiceGroup {...rest} dndDropRef={dndDropRef} {...dndDropProps} />;
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    serviceBinding: getServiceBindingStatus(state),
  };
};

export default connect(mapStateToProps)(observer(OperatorBackedService));
