import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';

import { OverviewDashboard } from './overview-dashboard/overview-dashboard';
import { HorizontalNav, PageHeading, LoadingBox } from '../utils';

const tabs = [
  {
    href: '',
    name: 'Overview',
    component: OverviewDashboard,
  },
];

const _DashboardsPage: React.FC<DashboardsPageProps> = ({ match, kindsInFlight }) => {
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

export const DashboardsPage = connect(mapStateToProps)(_DashboardsPage);

type DashboardsPageProps = RouteComponentProps & {
  kindsInFlight: boolean;
};
