import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import * as plugins from '../../plugins';
import { OverviewDashboard } from './overview-dashboard/overview-dashboard';
import { HorizontalNav, PageHeading } from '../utils';
import { Dashboard } from '../dashboard/dashboard';
import { DashboardGrid, GridPosition } from '../dashboard/grid';

const tabs = [
  {
    href: '',
    name: 'Overview',
    component: OverviewDashboard,
  },
];

const getPluginTabs = () => {
  const pluginDashboardCards = plugins.registry.getDashboardsCards();
  const pluginTabs = {};
  pluginDashboardCards.forEach(card => {
    if (!pluginTabs[card.properties.tab]) {
      pluginTabs[card.properties.tab] = {
        mainCards: [],
        leftCards: [],
        rightCards: [],
      };
    }
    switch (card.properties.position) {
      case GridPosition.LEFT:
        pluginTabs[card.properties.tab].leftCards.push(card.properties.component);
        return;
      case GridPosition.RIGHT:
        pluginTabs[card.properties.tab].rightCards.push(card.properties.component);
        return;
      case GridPosition.MAIN:
      default:
        pluginTabs[card.properties.tab].mainCards.push(card.properties.component);
    }
  });

  return Object.keys(pluginTabs).map(tabKey => ({
    href: tabKey,
    name: tabKey.charAt(0).toUpperCase() + tabKey.slice(1),
    component: () => (
      <Dashboard>
        <DashboardGrid
          mainCards={pluginTabs[tabKey].mainCards}
          leftCards={pluginTabs[tabKey].leftCards}
          rightCards={pluginTabs[tabKey].rightCards}
        />
      </Dashboard>
    ),
  }));
};

export const DashboardsPage: React.FC<RouteComponentProps> = ({ match }) => (
  <React.Fragment>
    <PageHeading title="Dashboards" detail={true} />
    <HorizontalNav match={match} pages={tabs.concat(getPluginTabs())} noStatusBox />
  </React.Fragment>
);
