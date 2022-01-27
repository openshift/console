import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import {
  RunningVMsChartLegendLabel,
  RunningVMsChartLegendLabelItem,
} from './RunningVMsChartLegendLabel';

import './running-vms-per-template-card.scss';

export const VMsChartLegend = ({ legendItems }) => {
  const gridItems = [];
  legendItems.forEach((item: RunningVMsChartLegendLabelItem) => {
    const component = (
      <GridItem span={6} key={item.name}>
        <RunningVMsChartLegendLabel item={item} />
      </GridItem>
    );
    gridItems.push(component);
  });

  return (
    <div className="kv-running-vms-card__chart-legend">
      <Grid hasGutter>{gridItems}</Grid>
    </div>
  );
};
