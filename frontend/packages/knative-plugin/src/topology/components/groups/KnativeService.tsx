import * as React from 'react';
import {
  Node,
  observer,
  WithSelectionProps,
  WithContextMenuProps,
  WithDndDropProps,
  useDragNode,
} from '@patternfly/react-topology';
import classNames from 'classnames';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { WithCreateConnectorProps } from '@console/topology/src/behavior';
import { nodeDragSourceSpec, GroupNode } from '@console/topology/src/components/graph-view';
import { getKindStringAndAbbreviation } from '@console/topology/src/components/graph-view/components/nodes/nodeUtils';
import { getResource } from '@console/topology/src/utils';
import { TYPE_KNATIVE_SERVICE } from '../../const';
import KnativeServiceGroup from './KnativeServiceGroup';

import './KnativeService.scss';

export type KnativeServiceProps = {
  element: Node;
  highlight?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  edgeDragging?: boolean;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const KnativeService: React.FC<KnativeServiceProps> = ({ children, ...props }) => {
  const { element } = props;
  const { data } = element.getData();
  const resourceObj = getResource(props.element);
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'patch',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  const { kindAbbr, kindStr, kindColor } = getKindStringAndAbbreviation(data.kind);
  const badgeClassName = classNames('odc-resource-icon', {
    [`odc-resource-icon-${kindStr.toLowerCase()}`]: !kindColor,
  });
  const dragSpec = React.useMemo(() => nodeDragSourceSpec(TYPE_KNATIVE_SERVICE, true, editAccess), [
    editAccess,
  ]);
  const dragProps = React.useMemo(() => ({ element }), [element]);
  const [{ dragging, regrouping }, dragNodeRef] = useDragNode(dragSpec, dragProps);

  if (props.element.isCollapsed()) {
    return (
      <GroupNode
        {...props}
        bgClassName="odc-knative-service__bg"
        badge={kindAbbr}
        badgeColor={kindColor}
        badgeClassName={badgeClassName}
        dragging={dragging}
        dragNodeRef={dragNodeRef}
      >
        {children}
      </GroupNode>
    );
  }

  return (
    <KnativeServiceGroup
      {...props}
      badge={kindAbbr}
      badgeColor={kindColor}
      badgeClassName={badgeClassName}
      editAccess={editAccess}
      dragging={dragging}
      dragSpec={dragSpec}
      regrouping={regrouping}
      dragNodeRef={dragNodeRef}
    >
      {children}
    </KnativeServiceGroup>
  );
};

export default observer(KnativeService);
