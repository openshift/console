import * as React from 'react';
import {
  Node,
  observer,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
} from '@console/topology';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import { getTopologyResourceObject } from '../../topology-utils';
import HelmReleaseNode from './HelmReleaseNode';
import HelmReleaseGroup from './HelmReleaseGroup';

import './HelmRelease.scss';

export type HelmReleaseProps = {
  element: Node;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDndDropProps;

const HelmRelease: React.FC<HelmReleaseProps> = (props) => {
  const resourceObj = getTopologyResourceObject(props.element.getData().groupResources[0]);
  const resourceModel = modelFor(referenceFor(resourceObj));
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'patch',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  if (props.element.isCollapsed()) {
    return <HelmReleaseNode editAccess={editAccess} {...props} />;
  }

  return <HelmReleaseGroup editAccess={editAccess} {...props} />;
};

export default observer(HelmRelease);
