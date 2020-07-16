import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import {
  HorizontalNav,
  PageHeading,
  history,
  useAccessReview,
} from '@console/internal/components/utils';
import { TechPreviewBadge, ALL_NAMESPACES_KEY } from '@console/shared';
import { withStartGuide } from '@console/internal/components/start-guide';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import ProjectListPage from '../projects/ProjectListPage';
import ConnectedMonitoringDashboard from './dashboard/MonitoringDashboard';
import ConnectedMonitoringMetrics from './metrics/MonitoringMetrics';
import MonitoringEvents from './events/MonitoringEvents';
import ConnectedMonitoringAlerts from './alerts/MonitoringAlerts';

export const MONITORING_ALL_NS_PAGE_URI = '/dev-monitoring/all-namespaces';

type MonitoringPageProps = {
  match: RMatch<{
    ns?: string;
  }>;
};

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    history.push(MONITORING_ALL_NS_PAGE_URI);
  }
};

export const PageContents: React.FC<MonitoringPageProps> = ({ match }) => {
  const activeNamespace = match.params.ns;
  const prometheousRulesAccess = useAccessReview({
    group: 'monitoring.coreos.com',
    resource: 'prometheusrules',
    verb: 'get',
    namespace: activeNamespace,
  });
  const pages = [
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
    ...(prometheousRulesAccess
      ? [
          {
            href: 'alerts',
            name: 'Alerts',
            component: ConnectedMonitoringAlerts,
          },
        ]
      : []),
    {
      href: 'events',
      name: 'Events',
      component: MonitoringEvents,
    },
  ];
  return activeNamespace ? (
    <>
      <PageHeading badge={<TechPreviewBadge />} title="Monitoring" />
      <HorizontalNav pages={pages} match={match} noStatusBox />
    </>
  ) : (
    <ProjectListPage badge={<TechPreviewBadge />} title="Monitoring">
      Select a project to view monitoring metrics
    </ProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

export const MonitoringPage: React.FC<MonitoringPageProps> = (props) => (
  <>
    <Helmet>
      <title>Monitoring</title>
    </Helmet>
    <NamespacedPage
      hideApplications
      variant={NamespacedPageVariants.light}
      onNamespaceChange={handleNamespaceChange}
    >
      <PageContentsWithStartGuide {...props} />
    </NamespacedPage>
  </>
);

export default MonitoringPage;
