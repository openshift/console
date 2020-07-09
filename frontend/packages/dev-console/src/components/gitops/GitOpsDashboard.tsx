import * as React from 'react';
import Helmet from 'react-helmet';
import { PageHeading } from '@console/internal/components/utils';

const GitOpsDashboard: React.FC = () => (
  <>
    <Helmet>
      <title>GitOps</title>
    </Helmet>
    <PageHeading title="GitOps" />;
  </>
);

export default GitOpsDashboard;
