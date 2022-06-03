import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { global_breakpoint_lg as breakpointLG } from '@patternfly/react-tokens/dist/js/global_breakpoint_lg';
import { useRefWidth } from '../../hooks/use-ref-width';

const mapCardsToGrid = (
  cards: OverviewGridCard[] = [],
  keyPrefix: string,
  ignoreCardSpan: boolean = false,
): React.ReactNode[] =>
  cards.map(({ Card, span = 12 }, index) => (
    // eslint-disable-next-line react/no-array-index-key
    <GridItem key={`${keyPrefix}-${index}`} span={ignoreCardSpan ? 12 : span}>
      <Card />
    </GridItem>
  ));

export type OverviewCardSpan = 4 | 6 | 12;

export type OverviewGridCard = {
  Card: React.ComponentType<any>;
  span?: OverviewCardSpan;
};

export type OverviewGridProps = {
  mainCards: OverviewGridCard[];
  leftCards?: OverviewGridCard[];
  rightCards?: OverviewGridCard[];
};

export const OverviewGrid: React.FC<OverviewGridProps> = ({ mainCards, leftCards, rightCards }) => {
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
        <Grid hasGutter>
          <GridItem lg={12} md={12} sm={12}>
            <Grid hasGutter>{mainGridCards}</Grid>
          </GridItem>
          <GridItem lg={12} md={12} sm={12}>
            <Grid hasGutter>{leftGridCards}</Grid>
          </GridItem>
          <GridItem lg={12} md={12} sm={12}>
            <Grid hasGutter>{rightGridCards}</Grid>
          </GridItem>
        </Grid>
      ) : (
        <Grid hasGutter>
          <GridItem lg={3} md={3} sm={3}>
            <Grid hasGutter>{leftGridCards}</Grid>
          </GridItem>
          <GridItem lg={6} md={6} sm={6}>
            <Grid hasGutter>{mainGridCards}</Grid>
          </GridItem>
          <GridItem lg={3} md={3} sm={3}>
            <Grid hasGutter>{rightGridCards}</Grid>
          </GridItem>
        </Grid>
      )}
    </div>
  );
};
