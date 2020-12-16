import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import ProjectAccess from './ProjectAccess';

export interface ProjectAccessPageProps {
  customData: { activeNamespace: string };
}

const ProjectAccessPage: React.FC<ProjectAccessPageProps> = ({ customData }) => {
  const { activeNamespace } = customData;
  const props: React.ComponentProps<typeof ProjectAccess> = {
    formName: 'project access',
    namespace: activeNamespace,
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
