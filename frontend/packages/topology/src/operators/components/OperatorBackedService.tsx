import * as React from 'react';
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
  WithContextMenuProps,
} from '@patternfly/react-topology';
import { connect } from 'react-redux';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import {
  canDropEdgeOnNode,
  highlightNode,
  NodeComponentProps,
  nodesEdgeIsDragging,
} from '../../components/graph-view/components';
import { getServiceBindingStatus, getResource } from '../../utils/topology-utils';
import OperatorBackedServiceGroup from './OperatorBackedServiceGroup';
import OperatorBackedServiceNode from './OperatorBackedServiceNode';

import './OperatorBackedService.scss';

export const obsDropTargetSpec = (
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

type OperatorBackedServiceProps = {
  element: Node;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps &
  StateProps;

const OperatorBackedService: React.FC<OperatorBackedServiceProps> = ({
  serviceBinding,
  ...rest
}) => {
  const spec = React.useMemo(() => obsDropTargetSpec(serviceBinding), [serviceBinding]);
  const [dndDropProps, dndDropRef] = useDndDrop(spec, rest as any);
  const resourceObj = getResource(rest.element);
  const resourceModel = resourceObj ? modelFor(referenceFor(resourceObj)) : null;
  const editAccess = useAccessReview({
    group: resourceModel?.apiGroup,
    verb: 'patch',
    resource: resourceModel?.plural,
    name: resourceObj?.metadata.name,
    namespace: resourceObj?.metadata.namespace,
  });

  if (rest.element.isCollapsed()) {
    return (
      <OperatorBackedServiceNode
        {...rest}
        dndDropRef={dndDropRef}
        editAccess={editAccess}
        {...dndDropProps}
      />
    );
  }

  return (
    <OperatorBackedServiceGroup
      {...rest}
      dndDropRef={dndDropRef}
      editAccess={editAccess}
      {...dndDropProps}
    />
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    serviceBinding: getServiceBindingStatus(state),
  };
};

export default connect(mapStateToProps)(observer(OperatorBackedService));
