import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import ProjectAccess from './ProjectAccess';
import { useProjectAccessRoles } from './hooks';

export interface ProjectAccessPageProps {
  customData: { activeNamespace: string };
}

const ProjectAccessPage: React.FC<ProjectAccessPageProps> = ({ customData }) => {
  const { activeNamespace } = customData;
  const roles = useProjectAccessRoles();
  const props: React.ComponentProps<typeof ProjectAccess> = {
    namespace: activeNamespace,
    roles,
  };
  return (
    <Firehose
      resources={[
        {
          namespace: activeNamespace,
          kind: 'RoleBinding',
          prop: 'roleBindings',
          isList: true,
          optional: true,
        },
      ]}
    >
      <ProjectAccess {...props} />
    </Firehose>
  );
};

export default ProjectAccessPage;
