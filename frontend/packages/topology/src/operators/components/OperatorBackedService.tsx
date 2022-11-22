import * as React from 'react';
import {
  Node,
  observer,
  WithSelectionProps,
  WithDndDropProps,
  WithDragNodeProps,
  DropTargetSpec,
  GraphElement,
  CREATE_CONNECTOR_DROP_TYPE,
  isEdge,
  useDndDrop,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { connect } from 'react-redux';
import { useAccessReview } from '@console/internal/components/utils';
import { CronJobModel, JobModel, PodModel } from '@console/internal/models';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import {
  canDropEdgeOnNode,
  highlightNode,
  NodeComponentProps,
  nodesEdgeIsDragging,
} from '../../components/graph-view/components';
import { getKindStringAndAbbreviation } from '../../components/graph-view/components/nodes/nodeUtils';
import { OdcBaseEdge, OdcBaseNode } from '../../elements';
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
> => {
  const canCreateServiceBinding = (monitor) => {
    const sourceNode =
      monitor.getItem() instanceof OdcBaseEdge ? monitor.getItem().getSource() : monitor.getItem();
    return (
      sourceNode instanceof OdcBaseNode &&
      sourceNode.getData().resource.kind === JobModel.kind &&
      sourceNode.getData().resource.kind === CronJobModel.kind &&
      sourceNode.getData().resource.kind === PodModel.kind
    );
  };

  return {
    accept: [CREATE_CONNECTOR_DROP_TYPE],
    canDrop: (item, monitor, props) => {
      if (!serviceBinding) {
        return false;
      }

      if (canCreateServiceBinding(monitor)) {
        return false;
      }
      if (isEdge(item)) {
        return canDropEdgeOnNode(monitor.getOperation()?.type, item, props.element);
      }
      if (!props.element || item === props.element) {
        return false;
      }
      return !props.element.getTargetEdges().find((e) => e.getSource() === item);
    },
    collect: (monitor, props) => ({
      canDrop:
        serviceBinding && canCreateServiceBinding(monitor) && highlightNode(monitor, props.element),
      dropTarget: monitor.isOver({
        shallow: canCreateServiceBinding(monitor),
      }),
      edgeDragging: nodesEdgeIsDragging(monitor, props),
    }),
    dropHint: (item, monitor) =>
      serviceBinding && canCreateServiceBinding(monitor) && 'createServiceBinding',
  };
};

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

const OperatorBackedService: React.FC<OperatorBackedServiceProps> = ({
  serviceBinding,
  element,
  ...rest
}) => {
  const spec = React.useMemo(() => obsDropTargetSpec(serviceBinding), [serviceBinding]);
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
  const badgeClassName = classNames('odc-resource-icon', {
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

const mapStateToProps = (state: RootState): StateProps => {
  return {
    serviceBinding: getServiceBindingStatus(state),
  };
};

export default connect(mapStateToProps)(observer(OperatorBackedService));
