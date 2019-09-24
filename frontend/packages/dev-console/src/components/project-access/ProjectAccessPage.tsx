import * as React from 'react';
import { match as RMatch } from 'react-router';
import { NamespaceBar } from '@console/internal/components/namespace';
import RenderProjectAccessPage, { RenderProjectAccessPageProps } from './RenderProjectAccessPage';

export interface ProjectAccessPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const ProjectAccessPage: React.FC<ProjectAccessPageProps> = ({ match }) => {
  const namespace = match.params.ns;
  const props: RenderProjectAccessPageProps = {
    namespace,
  };
  return (
    <React.Fragment>
      <NamespaceBar />
      <RenderProjectAccessPage {...props} />
    </React.Fragment>
  );
};

export default ProjectAccessPage;
