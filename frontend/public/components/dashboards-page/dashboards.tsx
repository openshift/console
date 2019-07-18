import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import {
  connectToExtensions,
  Extension,
  DashboardsTab,
  DashboardsCard,
  isDashboardsTab,
  isDashboardsCard,
} from '@console/plugin-sdk';
import { OverviewDashboard } from './overview-dashboard/overview-dashboard';
import { HorizontalNav, PageHeading, LoadingBox, Page, AsyncComponent } from '../utils';
import { Dashboard } from '../dashboard/dashboard';
import { DashboardGrid, GridPosition, GridDashboardCard } from '../dashboard/grid';

const getCardsOnPosition = (cards: DashboardsCard[], position: GridPosition): GridDashboardCard[] =>
  cards.filter(c => c.properties.position === position).map(c => ({
    Card: () => <AsyncComponent loader={c.properties.loader} />,
    span: c.properties.span,
  }));

const getTabs = (pluginTabs: DashboardsTab[],pluginCards: DashboardsCard[]): Page[] => {
  const tabs = pluginTabs.map(tab => {
    const tabCards = pluginCards.filter(c => c.properties.tab === tab.properties.id);
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

  return [
    {
      href: '',
      name: 'Overview',
      component: OverviewDashboard,
    },
    ...tabs,
  ];
};

const DashboardsPage_: React.FC<DashboardsPageProps> = ({
  match,
  kindsInFlight,
  k8sModels,
  pluginTabs,
  pluginCards,
}) => {
  return kindsInFlight && k8sModels.size === 0
    ? <LoadingBox />
    : (
      <>
        <PageHeading title="Dashboards" detail={true} />
        <HorizontalNav match={match} pages={getTabs(pluginTabs, pluginCards)} noStatusBox />
      </>
    );
};

const mapExtensionsToProps = (extensions: Extension[]) => ({
  pluginTabs: extensions.filter(isDashboardsTab),
  pluginCards: extensions.filter(isDashboardsCard),
});

const mapStateToProps = ({k8s}) => ({
  kindsInFlight: k8s.getIn(['RESOURCES', 'inFlight']),
  k8sModels: k8s.getIn(['RESOURCES', 'models']),
});

export const DashboardsPage = connect(mapStateToProps)(connectToExtensions(mapExtensionsToProps)(DashboardsPage_));

type DashboardsPageProps = RouteComponentProps & {
  kindsInFlight: boolean;
  k8sModels: ImmutableMap<string, any>;
  pluginCards: DashboardsCard[];
  pluginTabs: DashboardsTab[];
};
