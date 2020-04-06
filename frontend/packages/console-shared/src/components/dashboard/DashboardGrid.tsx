import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { global_breakpoint_lg as breakpointLG } from '@patternfly/react-tokens';
import { DashboardCardSpan } from '@console/plugin-sdk';
import { useRefWidth } from '@console/internal/components/utils/ref-width-hook';

export enum GridPosition {
  MAIN = 'MAIN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const mapCardsToGrid = (
  cards: GridDashboardCard[] = [],
  keyPrefix: string,
  ignoreCardSpan: boolean = false,
): React.ReactNode[] =>
  cards.map(({ Card, span = 12 }, index) => (
    // eslint-disable-next-line react/no-array-index-key
    <GridItem key={`${keyPrefix}-${index}`} span={ignoreCardSpan ? 12 : span}>
      <Card />
    </GridItem>
  ));

const DashboardGrid: React.FC<DashboardGridProps> = ({ mainCards, leftCards, rightCards }) => {
  const [containerRef, width] = useRefWidth();
  const smallGrid = !!containerRef.current && width <= parseInt(breakpointLG.value, 10);

  const mainGridCards = React.useMemo(() => mapCardsToGrid(mainCards, 'main', smallGrid), [
    mainCards,
    smallGrid,
  ]);
  const leftGridCards = React.useMemo(() => mapCardsToGrid(leftCards, 'left', smallGrid), [
    leftCards,
    smallGrid,
  ]);
  const rightGridCards = React.useMemo(() => mapCardsToGrid(rightCards, 'right', smallGrid), [
    rightCards,
    smallGrid,
  ]);

  return (
    <div ref={containerRef}>
      {smallGrid ? (
        <Grid className="co-dashboard-grid">
          <GridItem lg={12} md={12} sm={12}>
            <Grid className="co-dashboard-grid">{mainGridCards}</Grid>
          </GridItem>
          <GridItem lg={12} md={12} sm={12}>
            <Grid className="co-dashboard-grid">{leftGridCards}</Grid>
          </GridItem>
          <GridItem lg={12} md={12} sm={12}>
            <Grid className="co-dashboard-grid">{rightGridCards}</Grid>
          </GridItem>
        </Grid>
      ) : (
        <Grid className="co-dashboard-grid">
          <GridItem lg={3} md={3} sm={3}>
            <Grid className="co-dashboard-grid">{leftGridCards}</Grid>
          </GridItem>
          <GridItem lg={6} md={6} sm={6}>
            <Grid className="co-dashboard-grid">{mainGridCards}</Grid>
          </GridItem>
          <GridItem lg={3} md={3} sm={3}>
            <Grid className="co-dashboard-grid">{rightGridCards}</Grid>
          </GridItem>
        </Grid>
      )}
    </div>
  );
};

export default DashboardGrid;

export type GridDashboardCard = {
  Card: React.ComponentType<any>;
  span?: DashboardCardSpan;
};

type DashboardGridProps = {
  mainCards: GridDashboardCard[];
  leftCards?: GridDashboardCard[];
  rightCards?: GridDashboardCard[];
};
