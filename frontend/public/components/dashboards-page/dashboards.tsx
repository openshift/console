import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { OverviewDashboard } from './overview-dashboard/overview-dashboard';
import { HorizontalNav, PageHeading } from '../utils';

const tabs = [
  {
    href: '',
    name: 'Overview',
    component: OverviewDashboard,
  },
];

export const DashboardsPage: React.FC<RouteComponentProps> = ({ match }) => (
  <React.Fragment>
    <PageHeading title="Dashboards" detail={true} />
    <HorizontalNav match={match} pages={tabs} noStatusBox />
  </React.Fragment>
);
