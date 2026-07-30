import type { FC } from 'react';
import type { Visualization } from '@patternfly/react-topology';
import {
  TopologyControlBar as PfTopologyControlBar,
  observer,
  action,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
} from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';

import './TopologyControlBar.scss';

interface ControlBarProps {
  visualization: Visualization;
  isDisabled: boolean;
}

const TopologyControlBar: FC<ControlBarProps> = observer(({ visualization, isDisabled }) => {
  const { t } = useTranslation('topology');
  return (
    <span className="pf-topology-control-bar odc-topology-control-bar">
      <PfTopologyControlBar
        controlButtons={[
          ...createTopologyControlButtons({
            ...defaultControlButtonsOptions,
            zoomInCallback: action(() => {
              visualization.getGraph().scaleBy(4 / 3);
            }),
            zoomInTip: t('Zoom in'),
            zoomInAriaLabel: t('Zoom in'),
            zoomInDisabled: isDisabled,
            zoomOutCallback: action(() => {
              visualization.getGraph().scaleBy(0.75);
            }),
            zoomOutTip: t('Zoom out'),
            zoomOutAriaLabel: t('Zoom out'),
            zoomOutDisabled: isDisabled,
            fitToScreenCallback: action(() => {
              visualization.getGraph().fit(80);
            }),
            fitToScreenTip: t('Fit to screen'),
            fitToScreenAriaLabel: t('Fit to screen'),
            fitToScreenDisabled: isDisabled,
            resetViewCallback: action(() => {
              visualization.getGraph().reset();
              visualization.getGraph().layout();
            }),
            resetViewTip: t('Reset view'),
            resetViewAriaLabel: t('Reset view'),
            resetViewDisabled: isDisabled,
            legend: false,
          }),
        ]}
      />
    </span>
  );
});

export default TopologyControlBar;
