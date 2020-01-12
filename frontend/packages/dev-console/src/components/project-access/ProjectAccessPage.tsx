import * as React from 'react';
import { match as RMatch } from 'react-router';
import { NamespaceBar } from '@console/internal/components/namespace';
import RenderProjectAccess from './RenderProjectAccessPage';

export interface ProjectAccessPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const ProjectAccessPage: React.FC<ProjectAccessPageProps> = ({ match }) => {
  const namespace = match.params.ns;
  const props: React.ComponentProps<typeof RenderProjectAccess> = {
    namespace,
  };
  return (
    <>
      <NamespaceBar />
      <RenderProjectAccess {...props} />
    </>
  );
};

export default ProjectAccessPage;
