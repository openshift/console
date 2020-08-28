import * as React from 'react';
import { Helmet } from 'react-helmet';
import { PageLayout } from '@console/shared';
import QuickStartCatalog from './catalog/QuickStartCatalog';
import useQuickStarts from './utils/useQuickStarts';

const QuickStartCatalogPage: React.FC = () => {
  const quickStarts = useQuickStarts();
  return (
    <>
      <Helmet>
        <title>Quick Starts</title>
      </Helmet>
      <PageLayout title="Quick Starts" isDark>
        <QuickStartCatalog quickStarts={quickStarts} />
      </PageLayout>
    </>
  );
};

export default QuickStartCatalogPage;
