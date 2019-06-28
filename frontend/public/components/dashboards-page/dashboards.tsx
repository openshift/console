import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import * as plugins from '../../plugins';
import { OverviewDashboard } from './overview-dashboard/overview-dashboard';
import { HorizontalNav, PageHeading, LoadingBox, Page, AsyncComponent } from '../utils';
import { Dashboard } from '../dashboard/dashboard';
import { DashboardGrid, GridPosition, GridDashboardCard } from '../dashboard/grid';
import { DashboardsCard } from '@console/plugin-sdk';

const getCardsOnPosition = (cards: DashboardsCard[], position: GridPosition): GridDashboardCard[] =>
  cards.filter(c => c.properties.position === position).map(c => ({
    Card: () => <AsyncComponent loader={c.properties.loader} />,
    span: c.properties.span,
  }));

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

const DashboardsPage_: React.FC<DashboardsPageProps> = ({ match, kindsInFlight, k8sModels }) => {
  return kindsInFlight && k8sModels.size === 0
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
  k8sModels: k8s.getIn(['RESOURCES', 'models']),
});

export const DashboardsPage = connect(mapStateToProps)(DashboardsPage_);

type DashboardsPageProps = RouteComponentProps & {
  kindsInFlight: boolean;
  k8sModels: ImmutableMap<string, any>;
};
