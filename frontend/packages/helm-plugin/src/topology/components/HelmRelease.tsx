import * as React from 'react';
import {
  Node,
  observer,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  WithDragNodeProps,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import GroupNode from '@console/topology/src/components/graph-view/components/groups/GroupNode';
import { getKindStringAndAbbreviation } from '@console/topology/src/components/graph-view/components/nodes/nodeUtils';
import { getResource } from '@console/topology/src/utils/topology-utils';
import HelmReleaseGroup from './HelmReleaseGroup';

import './HelmRelease.scss';

type HelmReleaseProps = {
  element: Node;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDragNodeProps &
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
  const { kindAbbr, kindStr, kindColor } = getKindStringAndAbbreviation('HelmRelease');
  const badgeClassName = classNames('odc-resource-icon', {
    [`odc-resource-icon-${kindStr.toLowerCase()}`]: !kindColor,
  });

  if (props.element.isCollapsed()) {
    return (
      <GroupNode
        {...props}
        onContextMenu={editAccess ? props.onContextMenu : null}
        bgClassName="odc-helm-release__bg"
        badge={kindAbbr}
        badgeColor={kindColor}
        badgeClassName={badgeClassName}
      />
    );
  }

  return <HelmReleaseGroup editAccess={editAccess} {...props} />;
};

export default observer(HelmRelease);
