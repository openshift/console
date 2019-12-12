import * as React from 'react';
import * as classNames from 'classnames';
import {
  WithSourceDragProps,
  WithTargetDragProps,
  WithRemoveConnectorProps,
  Edge,
  observer,
  EdgeConnectorArrow,
} from '@console/topology';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import { getTopologyResourceObject } from '../../../topology/topology-utils';
import BaseEdge from './BaseEdge';
import './ConnectsTo.scss';

type ConnectsToProps = {
  element: Edge;
  dragging?: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithRemoveConnectorProps;

const ConnectsTo: React.FC<ConnectsToProps> = ({ element, targetDragRef, children, ...others }) => {
  const resourceObj = getTopologyResourceObject(element.getSource().getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'patch',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  const edgeClasses = classNames('odc2-connects-to', { 'odc2-m-editable': editAccess });
  return (
    <BaseEdge className={edgeClasses} element={element} {...others}>
      <EdgeConnectorArrow dragRef={editAccess ? targetDragRef : undefined} edge={element} />
      {children}
    </BaseEdge>
  );
};

export default observer(ConnectsTo);
