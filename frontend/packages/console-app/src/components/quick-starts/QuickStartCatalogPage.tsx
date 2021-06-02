import * as React from 'react';
import { Text } from '@patternfly/react-core';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils';
import QuickStartCatalog from './catalog/QuickStartCatalog';
import QuickStartsLoader from './loader/QuickStartsLoader';

const QuickStartCatalogPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('quickstart~Quick Starts')}</title>
      </Helmet>
      <div className="ocs-page-layout__header">
        <Text component="h1" className="ocs-page-layout__title">
          {t('quickstart~Quick Starts')}
        </Text>
        <div className="ocs-page-layout__hint">
          {t(
            'quickstart~Learn how to create, import, and run applications on OpenShift with step-by-step instructions and tasks.',
          )}
        </div>
      </div>
      <QuickStartsLoader>
        {(quickStarts, loaded) =>
          loaded ? <QuickStartCatalog quickStarts={quickStarts} /> : <LoadingBox />
        }
      </QuickStartsLoader>
    </>
  );
};

export default QuickStartCatalogPage;
