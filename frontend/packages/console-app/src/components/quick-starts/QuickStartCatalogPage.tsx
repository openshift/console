import * as React from 'react';
import { Helmet } from 'react-helmet';
import { PageLayout } from '@console/shared';
import { getQuickStarts } from './utils/quick-start-utils';
import QuickStartCatalog from './catalog/QuickStartCatalog';

const QuickStartCatalogPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Quick Starts</title>
      </Helmet>
      <PageLayout title="Quick Starts" isDark>
        <QuickStartCatalog quickStarts={getQuickStarts()} />
      </PageLayout>
    </>
  );
};

export default QuickStartCatalogPage;
