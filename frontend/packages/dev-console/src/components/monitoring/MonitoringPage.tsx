import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router';
import MonitoringDashboardsPage from '@console/internal/components/monitoring/dashboards';
import { withStartGuide } from '@console/internal/components/start-guide';
import {
  HorizontalNav,
  PageHeading,
  history,
  useAccessReview,
} from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { PageTitleContext } from '@console/shared/src/components/pagetitle/PageTitleContext';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from '../projects/CreateProjectListPage';
import { MonitoringSilencesPage } from './alerts/monitoring-silences';
import ConnectedMonitoringAlerts from './alerts/MonitoringAlerts';
import MonitoringEvents from './events/MonitoringEvents';
import ConnectedMonitoringMetrics from './metrics/MonitoringMetrics';

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
  const { t } = useTranslation();
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
      // t('devconsole~Dashboard')
      nameKey: 'devconsole~Dashboard',
      component: MonitoringDashboardsPage,
    },
    {
      href: 'metrics',
      // t('devconsole~Metrics')
      nameKey: 'devconsole~Metrics',
      component: ConnectedMonitoringMetrics,
    },
    ...(prometheousRulesAccess
      ? [
          {
            href: 'alerts',
            // t('devconsole~Alerts')
            nameKey: 'devconsole~Alerts',
            component: ConnectedMonitoringAlerts,
          },
          {
            href: 'silences',
            // t('devconsole~Silences')
            nameKey: 'devconsole~Silences',
            component: MonitoringSilencesPage,
          },
        ]
      : []),
    {
      href: 'events',
      // t('devconsole~Events')
      nameKey: 'devconsole~Events',
      component: MonitoringEvents,
    },
  ];
  const titleProviderValues = {
    telemetryPrefix: 'Observe',
    titlePrefix: t('devconsole~Observe'),
  };

  return activeNamespace ? (
    <PageTitleContext.Provider value={titleProviderValues}>
      <div className="odc-monitoring-page">
        <PageHeading title={t('devconsole~Observe')} />
        <HorizontalNav contextId="dev-console-observe" pages={pages} match={match} noStatusBox />
      </div>
    </PageTitleContext.Provider>
  ) : (
    <CreateProjectListPage title={t('devconsole~Observe')}>
      {(openProjectModal) => (
        <Trans t={t} ns="devconsole">
          Select a Project to view monitoring metrics
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

export const MonitoringPage: React.FC<MonitoringPageProps> = (props) => {
  return (
    <NamespacedPage
      hideApplications
      variant={NamespacedPageVariants.light}
      onNamespaceChange={handleNamespaceChange}
    >
      <PageContentsWithStartGuide {...props} />
    </NamespacedPage>
  );
};

export default MonitoringPage;
