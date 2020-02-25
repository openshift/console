import * as React from 'react';
import { Node, observer, WithSelectionProps, WithDndDropProps } from '@console/topology';
import HelmReleaseNode from './HelmReleaseNode';
import HelmReleaseGroup from './HelmReleaseGroup';

import './HelmRelease.scss';

export type HelmReleaseProps = {
  element: Node;
} & WithSelectionProps &
  WithDndDropProps;

const HelmRelease: React.FC<HelmReleaseProps> = (props) => {
  if (
    props.element.isCollapsed() ||
    !props.element.getData().groupResources ||
    !props.element.getData().groupResources.length
  ) {
    return <HelmReleaseNode {...props} />;
  }

  return <HelmReleaseGroup {...props} />;
};

export default observer(HelmRelease);
