import * as React from 'react';
import * as classNames from 'classnames';
import {
  WithSourceDragProps,
  WithTargetDragProps,
  WithRemoveConnectorProps,
  Edge,
  observer,
  EdgeConnectorArrow,
} from '@patternfly/react-topology';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import { getTopologyResourceObject } from '../../topology-utils';
import { BaseEdge } from './BaseEdge';
import './ConnectsTo.scss';

type ConnectsToProps = {
  element: Edge;
  dragging?: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithRemoveConnectorProps;

const ObservedConnectsTo: React.FC<ConnectsToProps> = ({
  element,
  targetDragRef,
  children,
  ...others
}) => {
  const childEdges = element.getChildren();
  const sourceData =
    childEdges?.length > 0
      ? (childEdges[0] as Edge).getSource().getData()
      : element.getSource().getData();
  const resourceObj = getTopologyResourceObject(sourceData);
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
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

const ConnectsTo = observer(ObservedConnectsTo);
export { ConnectsTo };
