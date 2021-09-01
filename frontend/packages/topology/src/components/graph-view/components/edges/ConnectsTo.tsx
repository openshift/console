import * as React from 'react';
import {
  WithSourceDragProps,
  WithTargetDragProps,
  WithContextMenuProps,
  Edge,
  observer,
  EdgeConnectorArrow,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { getResource } from '../../../../utils/topology-utils';
import BaseEdge from './BaseEdge';
import './ConnectsTo.scss';

type ConnectsToProps = {
  element: Edge;
  dragging?: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithContextMenuProps;
const ConnectsTo: React.FC<ConnectsToProps> = ({ element, targetDragRef, children, ...others }) => {
  const childEdges = element.getChildren();
  const source = childEdges?.length > 0 ? (childEdges[0] as Edge).getSource() : element.getSource();
  const resourceObj = getResource(source);
  const resourceModel = modelFor(referenceFor(resourceObj));
  const [editAccess] = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'patch',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  const edgeClasses = classNames('odc-connects-to', { 'odc-m-editable': editAccess });

  return (
    <BaseEdge className={edgeClasses} element={element} {...others}>
      <EdgeConnectorArrow dragRef={editAccess ? targetDragRef : undefined} edge={element} />
      {children}
    </BaseEdge>
  );
};

export default observer(ConnectsTo);
