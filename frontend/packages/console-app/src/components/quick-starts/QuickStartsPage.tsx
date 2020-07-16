import * as React from 'react';
import { Helmet } from 'react-helmet';
import { PageHeading } from '@console/internal/components/utils';
import { getQuickStartsWithStatus } from './utils/quick-start-utils';
import QuickStartCatalog from './QuickStartCatalog';

const QuickStartsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Quick Starts</title>
      </Helmet>
      <PageHeading title="Quick Starts" />
      <QuickStartCatalog quickStarts={getQuickStartsWithStatus()} />
    </>
  );
};

export default QuickStartsPage;
