import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import { BuildsPage } from '@console/internal/components/build';
import { NamespaceBar } from '@console/internal/components/namespace';
import DefaultPage from './DefaultPage';

export interface BuildconfigPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}
const BuildconfigPage: React.FC<BuildconfigPageProps> = (props) => {
  const namespace = props.match.params.ns;
  return (
    <React.Fragment>
      <Helmet>
        <title>Builds</title>
      </Helmet>
      <NamespaceBar />
      {namespace ? (
        <BuildsPage {...props} />
      ) : (
        <DefaultPage title="Builds">Select a project to view the builds</DefaultPage>
      )}
    </React.Fragment>
  );
};

export default BuildconfigPage;
