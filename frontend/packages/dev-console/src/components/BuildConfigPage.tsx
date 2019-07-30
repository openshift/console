import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import { BuildConfigsPage } from '@console/internal/components/build-config';
import { withStartGuide } from '../../../../public/components/start-guide';
import DefaultPage from './DefaultPage';

export interface BuildConfigPageProps {
  match: RMatch<{
    ns?: string;
  }>;
  noProjectsAvailable?: boolean;
}

const BuildConfigPage: React.FC<BuildConfigPageProps> = ({ noProjectsAvailable, ...props }) => {
  const namespace = props.match.params.ns;
  return (
    <React.Fragment>
      <Helmet>
        <title>Builds</title>
      </Helmet>
      {namespace ? (
        <BuildConfigsPage {...props} mock={noProjectsAvailable} />
      ) : (
        <DefaultPage title="Build Configs">
          Select a project to view the list of build configs
        </DefaultPage>
      )}
    </React.Fragment>
  );
};

export default withStartGuide(BuildConfigPage);
