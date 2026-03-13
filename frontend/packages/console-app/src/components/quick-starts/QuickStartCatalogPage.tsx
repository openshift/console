import type { FC } from 'react';
import { useContext, useEffect } from 'react';
import type { QuickStartContextValues } from '@patternfly/quickstarts';
import {
  QuickStartCatalogPage as PfQuickStartCatalogPage,
  QuickStartContext,
} from '@patternfly/quickstarts';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { getQueryArgument } from '@console/shared/src/hooks/useQueryParamsMutator';
import { QuickStartsLoader } from './loader/QuickStartsLoader';
import { QuickStartEmptyState } from './QuickStartEmptyState';

export const QuickStartCatalogPage: FC = () => {
  const { t } = useTranslation('console-app');
  const { setFilter } = useContext<QuickStartContextValues>(QuickStartContext);

  useEffect(() => {
    const keyword = getQueryArgument('keyword');
    if (keyword && setFilter) {
      setFilter('keyword', keyword);
    }
  }, [setFilter]);

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
