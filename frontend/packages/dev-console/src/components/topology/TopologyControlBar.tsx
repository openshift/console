import * as React from 'react';
import * as classNames from 'classnames';
import { Button, PageHeaderToolsItem, Tooltip } from '@patternfly/react-core';
import { TopologyIcon } from '@patternfly/react-icons';
import {
  TopologyControlBar as PfTopologyControlBar,
  action,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  Visualization,
} from '@patternfly/react-topology';
import { COLA_FORCE_LAYOUT, COLA_LAYOUT } from './layouts/layoutFactory';

interface TopologyControlBarProps {
  visualization: Visualization;
}

const TopologyControlBar: React.FC<TopologyControlBarProps> = ({ visualization }) => {
  const layout = visualization.getGraph()?.getLayout() ?? 'COLA_LAYOUT';
  return (
    <span className="pf-topology-control-bar">
      <PfTopologyControlBar
        controlButtons={[
          ...createTopologyControlButtons({
            ...defaultControlButtonsOptions,
            zoomInCallback: action(() => {
              visualization.getGraph().scaleBy(4 / 3);
            }),
            zoomOutCallback: action(() => {
              visualization.getGraph().scaleBy(0.75);
            }),
            fitToScreenCallback: action(() => {
              visualization.getGraph().fit(80);
            }),
            resetViewCallback: action(() => {
              visualization.getGraph().reset();
              visualization.getGraph().layout();
            }),
            legend: false,
          }),
        ]}
      >
        <div className="odc-topology__layout-group">
          <Tooltip content="Layout 1">
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
                <TopologyIcon className="odc-topology__layout-button__icon" aria-label="Layout" />1
              </Button>
            </PageHeaderToolsItem>
          </Tooltip>
          <Tooltip content="Layout 2">
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
                <TopologyIcon className="odc-topology__layout-button__icon" aria-label="Layout" />2
              </Button>
            </PageHeaderToolsItem>
          </Tooltip>
        </div>
      </PfTopologyControlBar>
    </span>
  );
};

export default React.memo(TopologyControlBar);
