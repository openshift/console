import * as React from 'react';
import { QuickStartCatalogPage as PfQuickStartCatalogPage } from '@patternfly/quickstarts';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import QuickStartsLoader from './loader/QuickStartsLoader';

const QuickStartCatalogPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <DocumentTitle>{t('console-app~Quick Starts')}</DocumentTitle>
      <QuickStartsLoader>
        {(quickStarts, loaded) =>
          loaded ? (
            <PfQuickStartCatalogPage
              quickStarts={quickStarts}
              showFilter
              title={t('console-app~Quick Starts')}
              hint={t(
                'console-app~Learn how to create, import, and run applications on OpenShift with step-by-step instructions and tasks.',
              )}
            />
          ) : (
            <LoadingBox />
          )
        }
      </QuickStartsLoader>
    </>
  );
};

export default QuickStartCatalogPage;
