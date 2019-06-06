import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';

import { useRefWidth } from '../utils';

export const MEDIA_QUERY_LG = 992;

export const DashboardGrid: React.FC<DashboardGridProps> = ({ mainCards, leftCards, rightCards }) => {
  const [containerRef, width] = useRefWidth();
  const grid = width <= MEDIA_QUERY_LG ?
    (
      <Grid className="co-dashboard-grid">
        <GridItem lg={12} md={12} sm={12}>
          {mainCards}
        </GridItem>
        <GridItem key="left" lg={12} md={12} sm={12}>
          {leftCards}
        </GridItem>
        <GridItem key="right" lg={12} md={12} sm={12}>
          {rightCards}
        </GridItem>
      </Grid>
    ) : (
      <Grid className="co-dashboard-grid">
        <GridItem key="left" lg={3} md={3} sm={3}>
          {leftCards}
        </GridItem>
        <GridItem lg={6} md={6} sm={6}>
          {mainCards}
        </GridItem>
        <GridItem key="right" lg={3} md={3} sm={3}>
          {rightCards}
        </GridItem>
      </Grid>
    );

  return <div ref={containerRef}>{grid}</div>;
};

type DashboardGridProps = {
  mainCards: React.ReactNode,
  leftCards?: React.ReactNode,
  rightCards?: React.ReactNode,
};
