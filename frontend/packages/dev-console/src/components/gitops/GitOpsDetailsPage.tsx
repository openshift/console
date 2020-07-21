import * as React from 'react';
import Helmet from 'react-helmet';
import { match as Rmatch } from 'react-router-dom';
import { PageHeading } from '@console/internal/components/utils';

interface GitOpsDetailsPageProps {
  match: Rmatch<any>;
}

const GitOpsDetailsPage: React.FC<GitOpsDetailsPageProps> = ({ match }) => {
  const { appName } = match.params;
  return (
    <>
      <Helmet>
        <title>GitOps</title>
      </Helmet>
      <PageHeading title={appName} kind="application" />
    </>
  );
};

export default GitOpsDetailsPage;
