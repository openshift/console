import * as React from 'react';
import {
  Node,
  observer,
  WithSelectionProps,
  WithContextMenuProps,
  WithDndDropProps,
  WithCreateConnectorProps,
} from '@console/topology';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import { getTopologyResourceObject } from '@console/dev-console/src/components/topology';
import KnativeServiceNode from './KnativeServiceNode';
import KnativeServiceGroup from './KnativeServiceGroup';

import './KnativeService.scss';

export type KnativeServiceProps = {
  element: Node;
  highlight?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const KnativeService: React.FC<KnativeServiceProps> = (props) => {
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
    return <KnativeServiceNode {...props} editAccess={editAccess} />;
  }

  return <KnativeServiceGroup {...props} editAccess={editAccess} />;
};

export default observer(KnativeService);
