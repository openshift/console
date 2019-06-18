import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';

import { useRefWidth } from '../utils';

export const MEDIA_QUERY_LG = 992;

const mapCardsToGrid = (cards: React.ReactNode[], keyPrefix: string): React.ReactNode[] =>
  cards.map((card, index) => (
    <GridItem key={`${keyPrefix}-${index}`}span={12}>{card}</GridItem>
  ));

export const DashboardGrid: React.FC<DashboardGridProps> = ({ mainCards, leftCards = [], rightCards = [] }) => {
  const [containerRef, width] = useRefWidth();
  const grid = width <= MEDIA_QUERY_LG ?
    (
      <Grid className="co-dashboard-grid">
        <GridItem lg={12} md={12} sm={12}>
          <Grid className="co-dashboard-grid">
            {mapCardsToGrid(mainCards, 'main')}
          </Grid>
        </GridItem>
        <GridItem key="left" lg={12} md={12} sm={12}>
          <Grid className="co-dashboard-grid">
            {mapCardsToGrid(leftCards, 'left')}
          </Grid>
        </GridItem>
        <GridItem key="right" lg={12} md={12} sm={12}>
          <Grid className="co-dashboard-grid">
            {mapCardsToGrid(rightCards, 'right')}
          </Grid>
        </GridItem>
      </Grid>
    ) : (
      <Grid className="co-dashboard-grid">
        <GridItem key="left" lg={3} md={3} sm={3}>
          <Grid className="co-dashboard-grid">
            {mapCardsToGrid(leftCards, 'left')}
          </Grid>
        </GridItem>
        <GridItem lg={6} md={6} sm={6}>
          <Grid className="co-dashboard-grid">
            {mapCardsToGrid(mainCards, 'main')}
          </Grid>
        </GridItem>
        <GridItem key="right" lg={3} md={3} sm={3}>
          <Grid className="co-dashboard-grid">
            {mapCardsToGrid(rightCards, 'right')}
          </Grid>
        </GridItem>
      </Grid>
    );

  return <div ref={containerRef}>{grid}</div>;
};

type DashboardGridProps = {
  mainCards: React.ReactNode[],
  leftCards?: React.ReactNode[],
  rightCards?: React.ReactNode[],
};
