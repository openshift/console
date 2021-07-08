import * as React from 'react';
import { Button } from '@patternfly/react-core';
import Helmet from 'react-helmet';
import { useTranslation, Trans } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import CatalogController from '../catalog/CatalogController';
import CatalogServiceProvider from '../catalog/service/CatalogServiceProvider';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage from '../projects/CreateProjectListPage';

type SampleCatalogProps = RouteComponentProps<{ ns?: string }>;

const SampleCatalog: React.FC<SampleCatalogProps> = ({ match }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
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
                Select a Project to view the list of samples or{' '}
                <Button isInline variant="link" onClick={openProjectModal}>
                  create a Project
                </Button>
                .
              </Trans>
            )}
          </CreateProjectListPage>
        )}
      </NamespacedPage>
    </>
  );
};

export default SampleCatalog;
