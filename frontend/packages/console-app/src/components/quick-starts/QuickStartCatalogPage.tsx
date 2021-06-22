import * as React from 'react';
import { QuickStartCatalogPage as PfQuickStartCatalogPage } from '@patternfly/quickstarts';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils';
import QuickStartsLoader from './loader/QuickStartsLoader';

const QuickStartCatalogPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('quickstart~Quick Starts')}</title>
      </Helmet>
      <QuickStartsLoader>
        {(quickStarts, loaded) =>
          loaded ? (
            <PfQuickStartCatalogPage
              quickStarts={quickStarts}
              showFilter
              title={t('quickstart~Quick Starts')}
              hint={t(
                'quickstart~Learn how to create, import, and run applications on OpenShift with step-by-step instructions and tasks.',
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
