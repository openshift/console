import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { global_breakpoint_lg as breakpointLG } from '@patternfly/react-tokens';

import { useRefWidth } from '../utils/ref-width-hook';
import { DashboardCardSpan } from '@console/plugin-sdk';

export enum GridPosition {
  MAIN = 'MAIN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const mapCardsToGrid = (cards: GridDashboardCard[], keyPrefix: string, ignoreCardSpan: boolean = false): React.ReactNode[] =>
  cards.map(({Card, span = 12}, index) => (
    <GridItem key={`${keyPrefix}-${index}`} span={ignoreCardSpan ? 12 : span}><Card /></GridItem>
  ));

export const DashboardGrid: React.FC<DashboardGridProps> = ({ mainCards, leftCards = [], rightCards = [] }) => {
  const [containerRef, width] = useRefWidth();
  const grid = width <= parseInt(breakpointLG.value, 10) ?
    (
      <Grid className="co-dashboard-grid">
        <GridItem lg={12} md={12} sm={12}>
          <Grid className="co-dashboard-grid">
            {mapCardsToGrid(mainCards, 'main', true)}
          </Grid>
        </GridItem>
        <GridItem key="left" lg={12} md={12} sm={12}>
          <Grid className="co-dashboard-grid">
            {mapCardsToGrid(leftCards, 'left', true)}
          </Grid>
        </GridItem>
        <GridItem key="right" lg={12} md={12} sm={12}>
          <Grid className="co-dashboard-grid">
            {mapCardsToGrid(rightCards, 'right', true)}
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

export type GridDashboardCard = {
  Card: React.ComponentType<any>;
  span?: DashboardCardSpan;
}

type DashboardGridProps = {
  mainCards: GridDashboardCard[],
  leftCards?: GridDashboardCard[],
  rightCards?: GridDashboardCard[],
};
