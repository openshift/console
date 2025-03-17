import * as React from 'react';
import { QuickStartCatalogPage as PfQuickStartCatalogPage } from '@patternfly/quickstarts';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils';
import { Title } from '@console/shared/src/components/title/Title';
import QuickStartsLoader from './loader/QuickStartsLoader';

const QuickStartCatalogPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <Title>{t('console-app~Quick Starts')}</Title>
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
