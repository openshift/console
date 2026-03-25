import type { ReactNode, FC } from 'react';
import { useMemo } from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import type { OverviewGridCard, OverviewGridProps } from '@console/dynamic-plugin-sdk';
import { useRefWidth } from '@console/internal/components/utils/ref-width-hook';

import './dashboard.scss';

const mapCardsToGrid = (
  cards: OverviewGridCard[] = [],
  keyPrefix: string,
  ignoreCardSpan: boolean = false,
): ReactNode[] =>
  cards.map(({ Card, span = 12 }, index) => (
    // eslint-disable-next-line react/no-array-index-key
    <GridItem key={`${keyPrefix}-${index}`} span={ignoreCardSpan ? 12 : span}>
      <Card />
    </GridItem>
  ));

const DashboardGrid: FC<OverviewGridProps> = ({ mainCards, leftCards, rightCards }) => {
  const [containerRef, width] = useRefWidth();
  const smallGrid = !!width && width <= 992; // 992px is equivalent of --pf-t--global--breakpoint--lg

  const mainGridCards = useMemo(() => mapCardsToGrid(mainCards, 'main', smallGrid), [
    mainCards,
    smallGrid,
  ]);
  const leftGridCards = useMemo(() => mapCardsToGrid(leftCards, 'left', smallGrid), [
    leftCards,
    smallGrid,
  ]);
  const rightGridCards = useMemo(() => mapCardsToGrid(rightCards, 'right', smallGrid), [
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
