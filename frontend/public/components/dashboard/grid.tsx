import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';

import { useRefWidth } from '../utils/ref-width-hook';

export const MEDIA_QUERY_LG = 992;

export enum GridPosition {
  MAIN = 'MAIN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const mapCardsToGrid = (cards: React.ComponentType<any>[], keyPrefix: string): React.ReactNode[] =>
  cards.map((Card, index) => (
    <GridItem key={`${keyPrefix}-${index}`} span={12}><Card /></GridItem>
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
  mainCards: React.ComponentType<any>[],
  leftCards?: React.ComponentType<any>[],
  rightCards?: React.ComponentType<any>[],
};
