import * as React from 'react';
import {
  Node,
  observer,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import { getResource } from '@console/topology/src/utils/topology-utils';

import './KafkaConnection.scss';
import KafkaNode from './KafkaNode';

type KafkaConnectionProps = {
  element: Node;
  editAccess: boolean;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDndDropProps;

const KafkaConnection: React.FC<KafkaConnectionProps> = (props) => {
  const secretObj = getResource(props.element);
  const resourceModel = secretObj ? modelFor(referenceFor(secretObj)) : null;
  const editAccess = useAccessReview({
    group: resourceModel?.apiGroup,
    verb: 'patch',
    resource: resourceModel?.plural,
    name: secretObj?.metadata.name,
    namespace: secretObj?.metadata.namespace,
  });

  return <KafkaNode editAccess={editAccess} {...props} />;
};

export default observer(KafkaConnection);
