import * as React from 'react';
import Helmet from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { CatalogController, CatalogServiceProvider } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from '../projects/CreateProjectListPage';

const SampleCatalog: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  return (
    <>
      <Helmet>
        <title>{t('devconsole~Samples')}</title>
      </Helmet>
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
        {namespace ? (
          <CatalogServiceProvider namespace={namespace} catalogId="samples-catalog">
            {(service) => (
              <CatalogController
                {...service}
                hideSidebar
                title={t('devconsole~Samples')}
                description={t(
                  'devconsole~Get Started using applications by choosing a code sample.',
                )}
              />
            )}
          </CatalogServiceProvider>
        ) : (
          <CreateProjectListPage title={t('devconsole~Samples')}>
            {(openProjectModal) => (
              <Trans t={t} ns="devconsole">
                Select a Project to view the list of samples
                <CreateAProjectButton openProjectModal={openProjectModal} />.
              </Trans>
            )}
          </CreateProjectListPage>
        )}
      </NamespacedPage>
    </>
  );
};

export default SampleCatalog;
