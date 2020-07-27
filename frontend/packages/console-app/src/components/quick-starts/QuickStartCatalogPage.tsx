import * as React from 'react';
import { Helmet } from 'react-helmet';
import { PageHeading } from '@console/internal/components/utils';
import { getQuickStarts } from './utils/quick-start-utils';
import QuickStartCatalog from './catalog/QuickStartCatalog';

const QuickStartCatalogPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Quick Starts</title>
      </Helmet>
      <PageHeading title="Quick Starts" />
      <QuickStartCatalog quickStarts={getQuickStarts()} />
    </>
  );
};

export default QuickStartCatalogPage;
