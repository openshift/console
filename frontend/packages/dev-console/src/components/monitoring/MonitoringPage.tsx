import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { NavigateFunction } from 'react-router-dom-v5-compat';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import { withStartGuide } from '@console/internal/components/start-guide';
import { HorizontalNav } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { PageTitleContext } from '@console/shared/src/components/pagetitle/PageTitleContext';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from '../projects/CreateProjectListPage';
import MonitoringEvents from './events/MonitoringEvents';

export const MONITORING_ALL_NS_PAGE_URI = '/dev-monitoring/all-namespaces';

const handleNamespaceChange = (newNamespace: string, navigate: NavigateFunction): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    navigate(MONITORING_ALL_NS_PAGE_URI);
  }
};

export const PageContents: FC = () => {
  const params = useParams();
  const { t } = useTranslation();
  const activeNamespace = params.ns;

  const pages = [
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
        <HorizontalNav contextId="dev-console-observe" pages={pages} noStatusBox />
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

export const MonitoringPage = (props) => {
  const navigate = useNavigate();
  return (
    <NamespacedPage
      hideApplications
      variant={NamespacedPageVariants.light}
      onNamespaceChange={(newNamespace) => handleNamespaceChange(newNamespace, navigate)}
    >
      <PageContentsWithStartGuide {...props} />
    </NamespacedPage>
  );
};

export default MonitoringPage;
