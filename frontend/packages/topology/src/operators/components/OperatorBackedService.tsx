import type { FC } from 'react';
import { useMemo } from 'react';
import { css } from '@patternfly/react-styles';
import type {
  Node,
  WithSelectionProps,
  WithDndDropProps,
  WithDragNodeProps,
  DropTargetSpec,
  GraphElement,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import {
  observer,
  CREATE_CONNECTOR_DROP_TYPE,
  isEdge,
  useDndDrop,
} from '@patternfly/react-topology';
import { connect } from 'react-redux';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import type { NodeComponentProps } from '../../components/graph-view/components';
import {
  canDropEdgeOnNode,
  highlightNode,
  nodesEdgeIsDragging,
} from '../../components/graph-view/components';
import { getKindStringAndAbbreviation } from '../../components/graph-view/components/nodes/nodeUtils';
import { getResource } from '../../utils/topology-utils';
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
    const nodeElement = props.element as Node;
    if (!serviceBinding) {
      return false;
    }

    if (isEdge(item)) {
      return canDropEdgeOnNode(monitor.getOperation()?.type, item, nodeElement);
    }
    if (!nodeElement || item === nodeElement) {
      return false;
    }
    return !nodeElement.getTargetEdges().find((e) => e.getSource() === item);
  },
  collect: (monitor, props) => {
    return {
      canDrop: serviceBinding && highlightNode(monitor, props.element as Node),
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
  WithDragNodeProps &
  WithContextMenuProps &
  StateProps;

const OperatorBackedService: FC<OperatorBackedServiceProps> = ({
  serviceBinding,
  element,
  ...rest
}) => {
  const spec = useMemo(() => obsDropTargetSpec(serviceBinding), [serviceBinding]);
  const [dndDropProps, dndDropRef] = useDndDrop(spec, { element, ...rest });
  const resourceObj = getResource(element);
  const resourceModel = resourceObj ? modelFor(referenceFor(resourceObj)) : null;
  const editAccess = useAccessReview({
    group: resourceModel?.apiGroup,
    verb: 'patch',
    resource: resourceModel?.plural,
    name: resourceObj?.metadata.name,
    namespace: resourceObj?.metadata.namespace,
  });
  const { data } = element.getData();
  const ownerReferenceKind = referenceFor({ kind: data.operatorKind, apiVersion: data.apiVersion });
  const { kindAbbr, kindStr, kindColor } = getKindStringAndAbbreviation(ownerReferenceKind);
  const badgeClassName = css('odc-resource-icon', {
    [`odc-resource-icon-${kindStr.toLowerCase()}`]: !kindColor,
  });

  if (element.isCollapsed()) {
    return (
      <OperatorBackedServiceNode
        {...rest}
        element={element}
        dndDropRef={dndDropRef}
        editAccess={editAccess}
        badge={kindAbbr}
        badgeColor={kindColor}
        badgeClassName={badgeClassName}
        {...dndDropProps}
      />
    );
  }

  return (
    <OperatorBackedServiceGroup
      {...rest}
      element={element}
      dndDropRef={dndDropRef}
      editAccess={editAccess}
      badge={kindAbbr}
      badgeColor={kindColor}
      badgeClassName={badgeClassName}
      {...dndDropProps}
    />
  );
};

const mapStateToProps = (): StateProps => {
  return {
    serviceBinding: null,
  };
};

export default connect(mapStateToProps)(observer(OperatorBackedService));
