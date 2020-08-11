import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import { BuildConfigsPage } from '@console/internal/components/build-config';
import { withStartGuide } from '../../../../public/components/start-guide';
import CreateProjectListPage from './projects/CreateProjectListPage';

export interface BuildConfigPageProps {
  match: RMatch<{
    ns?: string;
  }>;
  noProjectsAvailable?: boolean;
}

const BuildConfigPage: React.FC<BuildConfigPageProps> = ({ noProjectsAvailable, ...props }) => {
  const namespace = props.match.params.ns;
  return (
    <>
      <Helmet>
        <title>Builds</title>
      </Helmet>
      {namespace ? (
        <div>
          <BuildConfigsPage {...props} mock={noProjectsAvailable} />
        </div>
      ) : (
        <CreateProjectListPage title="Build Configs">
          Select a project to view the list of build configs
        </CreateProjectListPage>
      )}
    </>
  );
};

export default withStartGuide(BuildConfigPage);
