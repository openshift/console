import * as React from 'react';
import {
  TopologyControlBar as PfTopologyControlBar,
  observer,
  action,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  Visualization,
} from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';

interface ControlBarProps {
  visualization: Visualization;
  isDisabled: boolean;
}

const TopologyControlBar: React.FC<ControlBarProps> = observer(({ visualization, isDisabled }) => {
  const { t } = useTranslation();
  return (
    <span className="pf-topology-control-bar">
      <PfTopologyControlBar
        controlButtons={[
          ...createTopologyControlButtons({
            ...defaultControlButtonsOptions,
            zoomInCallback: action(() => {
              visualization.getGraph().scaleBy(4 / 3);
            }),
            zoomInTip: t('topology~Zoom in'),
            zoomInAriaLabel: t('topology~Zoom in'),
            zoomInDisabled: isDisabled,
            zoomOutCallback: action(() => {
              visualization.getGraph().scaleBy(0.75);
            }),
            zoomOutTip: t('topology~Zoom out'),
            zoomOutAriaLabel: t('topology~Zoom out'),
            zoomOutDisabled: isDisabled,
            fitToScreenCallback: action(() => {
              visualization.getGraph().fit(80);
            }),
            fitToScreenTip: t('topology~Fit to screen'),
            fitToScreenAriaLabel: t('topology~Fit to screen'),
            fitToScreenDisabled: isDisabled,
            resetViewCallback: action(() => {
              visualization.getGraph().reset();
              visualization.getGraph().layout();
            }),
            resetViewTip: t('topology~Reset view'),
            resetViewAriaLabel: t('topology~Reset view'),
            resetViewDisabled: isDisabled,
            legend: false,
          }),
        ]}
      />
    </span>
  );
});

export default TopologyControlBar;
