import * as React from 'react';
import { QuickStartCatalogPage as PfQuickStartCatalogPage } from '@patternfly/quickstarts';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import QuickStartsLoader from './loader/QuickStartsLoader';

const QuickStartCatalogPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <DocumentTitle>{t('console-app~Quick Starts')}</DocumentTitle>
      <PageHeading
        title={t('console-app~Quick Starts')}
        helpText={t(
          'console-app~Learn how to create, import, and run applications on OpenShift with step-by-step instructions and tasks.',
        )}
      />
      <QuickStartsLoader>
        {(quickStarts, loaded) =>
          loaded ? (
            <PfQuickStartCatalogPage showTitle={false} quickStarts={quickStarts} showFilter />
          ) : (
            <LoadingBox />
          )
        }
      </QuickStartsLoader>
    </>
  );
};

export default QuickStartCatalogPage;
