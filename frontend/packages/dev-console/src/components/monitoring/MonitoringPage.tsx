import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { Helmet } from 'react-helmet';
import { useTranslation, Trans } from 'react-i18next';
import { match as RMatch } from 'react-router';
import { withStartGuide } from '@console/internal/components/start-guide';
import {
  HorizontalNav,
  PageHeading,
  history,
  useAccessReview,
} from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage from '../projects/CreateProjectListPage';
import ConnectedMonitoringAlerts from './alerts/MonitoringAlerts';
import ConnectedMonitoringDashboard from './dashboard/MonitoringDashboard';
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
      <PageHeading title={t('devconsole~Observe')} />
      <HorizontalNav pages={pages} match={match} noStatusBox />
    </>
  ) : (
    <CreateProjectListPage title={t('devconsole~Observe')}>
      {(openProjectModal) => (
        <Trans t={t} ns="devconsole">
          Select a Project to view monitoring metrics or{' '}
          <Button isInline variant="link" onClick={openProjectModal}>
            create a Project
          </Button>
          .
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

export const MonitoringPage: React.FC<MonitoringPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('devconsole~Observe')}</title>
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
