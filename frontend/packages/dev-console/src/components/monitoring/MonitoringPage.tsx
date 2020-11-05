import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router';
import {
  HorizontalNav,
  PageHeading,
  history,
  useAccessReview,
} from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { withStartGuide } from '@console/internal/components/start-guide';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage from '../projects/CreateProjectListPage';
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
      name: t('devconsole~Dashboard'),
      component: ConnectedMonitoringDashboard,
    },
    {
      href: 'metrics',
      name: t('devconsole~Metrics'),
      component: ConnectedMonitoringMetrics,
    },
    ...(prometheousRulesAccess
      ? [
          {
            href: 'alerts',
            name: t('devconsole~Alerts'),
            component: ConnectedMonitoringAlerts,
          },
        ]
      : []),
    {
      href: 'events',
      name: t('devconsole~Events'),
      component: MonitoringEvents,
    },
  ];
  return activeNamespace ? (
    <>
      <PageHeading title={t('devconsole~Monitoring')} />
      <HorizontalNav pages={pages} match={match} noStatusBox />
    </>
  ) : (
    <CreateProjectListPage title={t('devconsole~Monitoring')}>
      {t('devconsole~Select a project to view monitoring metrics')}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

export const MonitoringPage: React.FC<MonitoringPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('devconsole~Monitoring')}</title>
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
};

export default MonitoringPage;
