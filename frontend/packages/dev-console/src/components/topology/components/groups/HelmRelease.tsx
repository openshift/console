import * as React from 'react';
import { connect } from 'react-redux';
import { Node, observer, WithSelectionProps } from '@console/topology';
import { RootState } from '@console/internal/redux';
import { getTopologyFilters, TopologyFilters } from '../../filters/filter-utils';
import HelmReleaseNode from './HelmReleaseNode';
import HelmReleaseGroup from './HelmReleaseGroup';

import './HelmRelease.scss';

export type HelmReleaseProps = {
  element: Node;
  dragging?: boolean;
  filters: TopologyFilters;
} & WithSelectionProps;

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

const HelmReleaseState = (state: RootState) => ({
  filters: getTopologyFilters(state),
});

export default connect(HelmReleaseState)(observer(HelmRelease));
