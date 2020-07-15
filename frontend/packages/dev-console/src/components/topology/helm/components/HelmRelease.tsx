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
import { getResource } from '../../topology-utils';
import HelmReleaseNode from './HelmReleaseNode';
import HelmReleaseGroup from './HelmReleaseGroup';

import './HelmRelease.scss';

export type HelmReleaseProps = {
  element: Node;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDndDropProps;

const HelmRelease: React.FC<HelmReleaseProps> = (props) => {
  const secretObj = getResource(props.element);
  const resourceModel = secretObj ? modelFor(referenceFor(secretObj)) : null;
  const editAccess = useAccessReview({
    group: resourceModel?.apiGroup,
    verb: 'patch',
    resource: resourceModel?.plural,
    name: secretObj?.metadata.name,
    namespace: secretObj?.metadata.namespace,
  });
  if (props.element.isCollapsed()) {
    return <HelmReleaseNode editAccess={editAccess} {...props} />;
  }

  return <HelmReleaseGroup editAccess={editAccess} {...props} />;
};

export default observer(HelmRelease);
