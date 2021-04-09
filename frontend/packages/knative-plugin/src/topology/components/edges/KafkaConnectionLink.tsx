import * as React from 'react';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import {
  Edge,
  EdgeConnectorArrow,
  observer,
  WithSourceDragProps,
  WithTargetDragProps,
} from '@patternfly/react-topology';
import { getResource } from '@console/topology/src/utils';
import { BaseEdge } from '@console/topology/src/components/graph-view';
import './KafkaConnectionLink.scss';

type KafkaConnectionLinkProps = {
  element: Edge;
  dragging: boolean;
} & WithSourceDragProps &
  WithTargetDragProps;

const KafkaConnectionLink: React.FC<KafkaConnectionLinkProps> = ({
  element,
  targetDragRef,
  children,
  ...others
}) => {
  const resourceObj = getResource(element.getSource());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'update',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });

  return (
    <BaseEdge className="odc-kafka-connection-link" element={element} {...others}>
      <EdgeConnectorArrow dragRef={editAccess ? targetDragRef : undefined} edge={element} />
      {children}
    </BaseEdge>
  );
};

export default observer(KafkaConnectionLink);
