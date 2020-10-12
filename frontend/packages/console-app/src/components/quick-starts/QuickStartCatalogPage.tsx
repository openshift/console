import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils';
import { PageLayout } from '@console/shared';
import QuickStartCatalog from './catalog/QuickStartCatalog';
import QuickStartsLoader from './loader/QuickStartsLoader';

const QuickStartCatalogPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('quickstart~Quick Starts')}</title>
      </Helmet>
      <PageLayout title={t('quickstart~Quick Starts')} isDark>
        <QuickStartsLoader>
          {(quickStarts, loaded) =>
            loaded ? <QuickStartCatalog quickStarts={quickStarts} /> : <LoadingBox />
          }
        </QuickStartsLoader>
      </PageLayout>
    </>
  );
};

export default QuickStartCatalogPage;
