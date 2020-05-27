import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import { connect } from 'react-redux';
import { HorizontalNav, PageHeading, history } from '@console/internal/components/utils';
import { featureReducerName } from '@console/internal/reducers/features';
import { TechPreviewBadge, ALL_NAMESPACES_KEY, FLAGS } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import ProjectListPage from '../projects/ProjectListPage';
import ConnectedMonitoringDashboard from './dashboard/MonitoringDashboard';
import ConnectedMonitoringMetrics from './metrics/MonitoringMetrics';
import MonitoringEvents from './events/MonitoringEvents';

export const MONITORING_ALL_NS_PAGE_URI = '/dev-monitoring/all-namespaces';

type MonitoringPageProps = {
  match: RMatch<{
    ns?: string;
  }>;
};

type StateProps = {
  canAccess: boolean;
};

type Props = MonitoringPageProps & StateProps;

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    history.push(MONITORING_ALL_NS_PAGE_URI);
  }
};

export const MonitoringPage: React.FC<Props> = ({ match, canAccess }) => {
  const activeNamespace = match.params.ns;
  const canAccessPrometheus = canAccess && !!window.SERVER_FLAGS.prometheusBaseURL;

  const pages = React.useMemo(
    () => [
      ...(canAccessPrometheus
        ? [
            {
              href: '',
              name: 'Dashboard',
              component: ConnectedMonitoringDashboard,
            },
            {
              href: 'metrics',
              name: 'Metrics',
              component: ConnectedMonitoringMetrics,
            },
          ]
        : []),
      {
        href: canAccessPrometheus ? 'events' : '',
        name: 'Events',
        component: MonitoringEvents,
      },
    ],
    [canAccessPrometheus],
  );

  return (
    <>
      <Helmet>
        <title>Monitoring</title>
      </Helmet>
      <NamespacedPage
        hideApplications
        variant={NamespacedPageVariants.light}
        onNamespaceChange={handleNamespaceChange}
      >
        {activeNamespace ? (
          <>
            <PageHeading badge={<TechPreviewBadge />} title="Monitoring" />
            <HorizontalNav pages={pages} match={match} noStatusBox />
          </>
        ) : (
          <ProjectListPage badge={<TechPreviewBadge />} title="Monitoring">
            Select a project to view monitoring metrics
          </ProjectListPage>
        )}
      </NamespacedPage>
    </>
  );
};

const stateToProps = (state) => ({
  canAccess: !!state[featureReducerName].get(FLAGS.CAN_GET_NS),
});

export default connect<StateProps, {}, MonitoringPageProps>(stateToProps)(MonitoringPage);
