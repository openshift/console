import * as React from 'react';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
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
import { COLA_FORCE_LAYOUT, COLA_LAYOUT } from './layouts/layoutFactory';

interface TopologyControlBarProps {
  visualization: Visualization;
}

const TopologyControlBar: React.FC<TopologyControlBarProps> = observer(({ visualization }) => {
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
            zoomInTip: t('topology~Zoom In'),
            zoomInAriaLabel: t('topology~Zoom In'),
            zoomOutCallback: action(() => {
              visualization.getGraph().scaleBy(0.75);
            }),
            zoomOutTip: t('topology~Zoom Out'),
            zoomOutAriaLabel: t('topology~Zoom Out'),
            fitToScreenCallback: action(() => {
              visualization.getGraph().fit(80);
            }),
            fitToScreenTip: t('topology~Fit to screen'),
            fitToScreenAriaLabel: t('topology~Fit to screen'),
            resetViewCallback: action(() => {
              visualization.getGraph().reset();
              visualization.getGraph().layout();
            }),
            resetViewTip: t('topology~Reset view'),
            resetViewAriaLabel: t('topology~Reset view'),
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
