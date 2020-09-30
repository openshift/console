import * as React from 'react';
import { Helmet } from 'react-helmet';
import { LoadingBox } from '@console/internal/components/utils';
import { PageLayout } from '@console/shared';
import QuickStartCatalog from './catalog/QuickStartCatalog';
import QuickStartsLoader from './loader/QuickStartsLoader';

const QuickStartCatalogPage: React.FC = () => (
  <>
    <Helmet>
      <title>Quick Starts</title>
    </Helmet>
    <PageLayout title="Quick Starts" isDark>
      <QuickStartsLoader>
        {(quickStarts, loaded) =>
          loaded ? <QuickStartCatalog quickStarts={quickStarts} /> : <LoadingBox />
        }
      </QuickStartsLoader>
    </PageLayout>
  </>
);

export default QuickStartCatalogPage;
