import * as React from 'react';
import Helmet from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { CatalogController, CatalogServiceProvider } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from '../projects/CreateProjectListPage';

const SampleCatalog: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const params = new URLSearchParams(window.location.search);
  const sampleType = params.get('sampleType');
  const labelFilter: Record<string, string> = {
    label: 'sample-type',
    value: sampleType,
  };
  return (
    <>
      <Helmet>
        <title>{t('devconsole~Samples')}</title>
      </Helmet>
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
        {namespace ? (
          <CatalogServiceProvider namespace={namespace} catalogId="samples-catalog">
            {(service) => {
              let filteredLists: CatalogItem[];
              if (sampleType) {
                filteredLists = service.items.filter((item) => {
                  return (
                    item?.typeLabel === labelFilter?.value ||
                    item?.data?.metadata?.labels[labelFilter?.label] === labelFilter?.value
                  );
                });
              } else {
                filteredLists = service.items;
              }
              const catalogItems = { ...service, items: filteredLists };

              return (
                <CatalogController
                  {...catalogItems}
                  hideSidebar
                  title={t('devconsole~Samples')}
                  description={t(
                    'devconsole~Get Started using applications by choosing a code sample.',
                  )}
                />
              );
            }}
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
