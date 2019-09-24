import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { withStartGuide } from '@console/internal/components/start-guide';
import ProjectListPage from '../projects/ProjectListPage';
import ProjectAccess, { ProjectAccessProps } from './ProjectAccess';

export interface RenderProjectAccessPageProps {
  namespace: string;
}

const RenderProjectAccessPage: React.FC<RenderProjectAccessPageProps> = ({ namespace }) => {
  const props: ProjectAccessProps = {
    formName: 'project access',
    namespace,
  };
  return (
    <React.Fragment>
      {namespace ? (
        <React.Fragment>
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
            <ProjectAccess {...props} />
          </Firehose>
        </React.Fragment>
      ) : (
        <ProjectListPage title="Project Access">
          Select a project to view the list of users with access to the project.
        </ProjectListPage>
      )}
    </React.Fragment>
  );
};

export default withStartGuide(RenderProjectAccessPage);
