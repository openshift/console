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
import { getTopologyResourceObject } from '../../topology-utils';
import OperatorBackedServiceGroup from './OperatorBackedServiceGroup';
import OperatorBackedServiceNode from './OperatorBackedServiceNode';

import './OperatorBackedService.scss';

export type OperatorBackedServiceProps = {
  element: Node;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDndDropProps;

const OperatorBackedService: React.FC<OperatorBackedServiceProps> = (
  props: OperatorBackedServiceProps,
) => {
  const resourceObj = getTopologyResourceObject(props.element.getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'patch',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  if (props.element.isCollapsed()) {
    return <OperatorBackedServiceNode editAccess={editAccess} {...props} />;
  }

  return <OperatorBackedServiceGroup editAccess={editAccess} {...props} />;
};

export default observer(OperatorBackedService);
