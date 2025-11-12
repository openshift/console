import * as React from 'react';
import { QuickStartCatalogPage as PfQuickStartCatalogPage } from '@patternfly/quickstarts';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import QuickStartsLoader from './loader/QuickStartsLoader';
import { QuickStartEmptyState } from './QuickStartEmptyState';

const QuickStartCatalogPage: React.FC = () => {
  const { t } = useTranslation('console-app');
  return (
    <>
      <DocumentTitle>{t('Quick Starts')}</DocumentTitle>
      <PageHeading
        title={t('Quick Starts')}
        helpText={t(
          'Learn how to create, import, and run applications on OpenShift with step-by-step instructions and tasks.',
        )}
      />
      <QuickStartsLoader>
        {(quickStarts, loaded) =>
          loaded ? (
            quickStarts.length > 0 ? (
              <PfQuickStartCatalogPage showTitle={false} quickStarts={quickStarts} showFilter />
            ) : (
              <QuickStartEmptyState />
            )
          ) : (
            <LoadingBox />
          )
        }
      </QuickStartsLoader>
    </>
  );
};

export default QuickStartCatalogPage;
