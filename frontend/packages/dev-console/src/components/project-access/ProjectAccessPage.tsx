import * as React from 'react';
import { match as RMatch } from 'react-router';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
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
    <NamespacedPage variant={NamespacedPageVariants.light}>
      <RenderProjectAccess {...props} />
    </NamespacedPage>
  );
};

export default ProjectAccessPage;
