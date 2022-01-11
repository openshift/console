import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import classnames from 'classnames';
import { TopConsumerMetric } from '../../../constants/virt-overview/top-consumers-card/top-consumer-metric';
import { TopConsumerCard } from './TopConsumerCard';

import './top-consumers-card.scss';

type TopConsumersGridRowProps = {
  topGrid?: boolean;
  numItemsToShow: number;
  initialMetrics: TopConsumerMetric[];
};

export const TopConsumersGridRow: React.FC<TopConsumersGridRowProps> = ({
  topGrid = false,
  numItemsToShow,
  initialMetrics,
}) => {
  const classes = classnames('kv-top-consumers-card__grid', {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'kv-top-consumers-card__top-grid': topGrid,
  });

  return (
    <Grid className={classes}>
      <GridItem span={4} className="kv-top-consumers-card__card-grid-item">
        <TopConsumerCard numItemsToShow={numItemsToShow} initialMetric={initialMetrics[0]} />
      </GridItem>
      <GridItem span={4} className="kv-top-consumers-card__card-grid-item">
        <TopConsumerCard numItemsToShow={numItemsToShow} initialMetric={initialMetrics[1]} />
      </GridItem>
      <GridItem span={4} className="kv-top-consumers-card__card-grid-item">
        <TopConsumerCard numItemsToShow={numItemsToShow} initialMetric={initialMetrics[2]} />
      </GridItem>
    </Grid>
  );
};
