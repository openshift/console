import * as React from 'react';
import { Button, PageHeaderToolsItem, Tooltip } from '@patternfly/react-core';
import { TopologyIcon } from '@patternfly/react-icons';
import {
  TopologyControlBar as PfTopologyControlBar,
  observer,
  action,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  Visualization,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { COLA_FORCE_LAYOUT, COLA_LAYOUT } from './layouts/layoutFactory';

interface ControlBarProps {
  visualization: Visualization;
  isDisabled: boolean;
}

const TopologyControlBar: React.FC<ControlBarProps> = observer(({ visualization, isDisabled }) => {
  const { t } = useTranslation();
  const layout = visualization.getGraph()?.getLayout() ?? COLA_LAYOUT;
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
      >
        <div className="odc-topology__layout-group">
          <Tooltip content={t('topology~Layout 1')}>
            <PageHeaderToolsItem className="odc-topology__layout-button" tabIndex={-1}>
              <Button
                className={classNames('pf-topology-control-bar__button', {
                  'pf-m-active': layout === COLA_LAYOUT,
                })}
                variant="tertiary"
                isDisabled={isDisabled}
                onClick={() => {
                  visualization.getGraph().setLayout(COLA_LAYOUT);
                  visualization.getGraph().layout();
                }}
              >
                <TopologyIcon
                  className="odc-topology__layout-button__icon"
                  aria-label={t('topology~Layout')}
                />
                1
              </Button>
            </PageHeaderToolsItem>
          </Tooltip>
          <Tooltip content={t('topology~Layout 2')}>
            <PageHeaderToolsItem className="odc-topology__layout-button" tabIndex={-1}>
              <Button
                className={classNames('pf-topology-control-bar__button', {
                  'pf-m-active': layout === COLA_FORCE_LAYOUT,
                })}
                variant="tertiary"
                isDisabled={isDisabled}
                onClick={() => {
                  visualization.getGraph().setLayout(COLA_FORCE_LAYOUT);
                  visualization.getGraph().layout();
                }}
              >
                <TopologyIcon
                  className="odc-topology__layout-button__icon"
                  aria-label={t('topology~Layout')}
                />
                2
              </Button>
            </PageHeaderToolsItem>
          </Tooltip>
        </div>
      </PfTopologyControlBar>
    </span>
  );
});

export default TopologyControlBar;
