import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';

import * as plugins from '../../plugins';
import { OverviewDashboard } from './overview-dashboard/overview-dashboard';
import { HorizontalNav, PageHeading, LoadingBox, Page, AsyncComponent } from '../utils';
import { Dashboard } from '../dashboard/dashboard';
import { DashboardGrid, GridPosition } from '../dashboard/grid';
import { DashboardsCard } from '@console/plugin-sdk';

const getCardsOnPosition = (cards: DashboardsCard[], position: GridPosition): React.ComponentType<any>[] =>
  cards.filter(c => c.properties.position === position).map(c => () => <AsyncComponent loader={c.properties.loader} />);

const getPluginTabPages = (): Page[] => {
  const cards = plugins.registry.getDashboardsCards();
  return plugins.registry.getDashboardsTabs().map(tab => {
    const tabCards = cards.filter(c => c.properties.tab === tab.properties.id);
    return {
      href: tab.properties.id,
      name: tab.properties.title,
      component: () => (
        <Dashboard>
          <DashboardGrid
            mainCards={getCardsOnPosition(tabCards, GridPosition.MAIN)}
            leftCards={getCardsOnPosition(tabCards, GridPosition.LEFT)}
            rightCards={getCardsOnPosition(tabCards, GridPosition.RIGHT)}
          />
        </Dashboard>
      ),
    };
  });
};

const tabs: Page[] = [
  {
    href: '',
    name: 'Overview',
    component: OverviewDashboard,
  },
  ...getPluginTabPages(),
];

const DashboardsPage_: React.FC<DashboardsPageProps> = ({ match, kindsInFlight }) => {
  return kindsInFlight
    ? <LoadingBox />
    : (
      <>
        <PageHeading title="Dashboards" detail={true} />
        <HorizontalNav match={match} pages={tabs} noStatusBox />
      </>
    );
};

const mapStateToProps = ({k8s}) => ({
  kindsInFlight: k8s.getIn(['RESOURCES', 'inFlight']),
});

export const DashboardsPage = connect(mapStateToProps)(DashboardsPage_);

type DashboardsPageProps = RouteComponentProps & {
  kindsInFlight: boolean;
};
