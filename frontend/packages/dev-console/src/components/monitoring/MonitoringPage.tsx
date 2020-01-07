import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import { HorizontalNav, PageHeading, history } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/internal/const';
import { TechPreviewBadge } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import ProjectListPage from '../projects/ProjectListPage';
import MonitoringDashboard from './dashboard/MonitoringDashboard';
import MonitoringMetrics from './metrics/MonitoringMetrics';

export const MONITORING_ALL_NS_PAGE_URI = '/dev-monitoring/all-namespaces';

interface MonitoringPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    history.push(MONITORING_ALL_NS_PAGE_URI);
  }
};

export const MonitoringPage: React.FC<MonitoringPageProps> = ({ match }) => {
  const activeNamespace = match.params.ns;

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
            <HorizontalNav
              pages={[
                {
                  href: '',
                  name: 'Dashboard',
                  component: MonitoringDashboard,
                },
                {
                  href: 'metrics',
                  name: 'Metrics',
                  component: MonitoringMetrics,
                },
              ]}
              match={match}
              noStatusBox
            />
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

export default MonitoringPage;
