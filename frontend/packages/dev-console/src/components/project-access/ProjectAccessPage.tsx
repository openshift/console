import * as React from 'react';
import { match as RMatch } from 'react-router';
import { Firehose } from '@console/internal/components/utils';
import { useProjectAccessRoles } from './hooks';
import ProjectAccess from './ProjectAccess';

export interface ProjectAccessPageProps {
  match: RMatch<{ ns?: string }>;
}

const ProjectAccessPage: React.FC<ProjectAccessPageProps> = ({ match, ...props }) => {
  const namespace = match.params.ns;
  const roles = useProjectAccessRoles();
  const showFullForm = match.path.includes('project-access');
  return (
    <Firehose
      resources={[
        {
          namespace,
          kind: 'RoleBinding',
          prop: 'roleBindings',
          isList: true,
          optional: true,
        },
      ]}
    >
      <ProjectAccess fullFormView={showFullForm} namespace={namespace} roles={roles} {...props} />
    </Firehose>
  );
};

export default ProjectAccessPage;
