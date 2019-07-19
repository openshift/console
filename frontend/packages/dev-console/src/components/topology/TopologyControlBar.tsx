import * as React from 'react';
import {
  TopologyControlBar as PFTopologyControlBar,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
} from '@patternfly/react-topology';
import { GraphApi } from './topology-types';

export interface TopologyControlBarProps {
  graphApi?: GraphApi;
}

const TopologyControlBar: React.FC<TopologyControlBarProps> = ({ graphApi }) => {
  const controlButtons = createTopologyControlButtons({
    ...defaultControlButtonsOptions,
    zoomInCallback: () => {
      graphApi && graphApi.zoomIn();
    },
    zoomOutCallback: () => {
      graphApi && graphApi.zoomOut();
    },
    fitToScreenCallback: () => {
      graphApi && graphApi.zoomFit();
    },
    resetViewCallback: () => {
      graphApi && graphApi.resetLayout();
    },
    legend: false,
  });

  return <PFTopologyControlBar controlButtons={controlButtons} />;
};

export default TopologyControlBar;
