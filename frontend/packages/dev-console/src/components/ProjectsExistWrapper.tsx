import * as React from 'react';
import * as _ from 'lodash';
import { HintBlock, LoadingBox } from '@console/internal/components/utils';
import ODCEmptyState from './EmptyState';

export interface ProjectsExistWrapperProps {
  title: string;
  projects?: { data: []; loaded: boolean };
  children: () => React.ReactElement;
}

const ProjectsExistWrapper: React.FC<ProjectsExistWrapperProps> = ({
  title,
  projects,
  children,
}) => {
  if (!projects.loaded) {
    return <LoadingBox />;
  }

  if (_.isEmpty(projects.data)) {
    return (
      <ODCEmptyState
        title={title}
        hintBlock={
          <HintBlock title="No projects exist">
            <p>
              Select one of the following options to create an application, component or service. As
              part of the creation process a project and application will be created.
            </p>
          </HintBlock>
        }
      />
    );
  }

  return children();
};

export default ProjectsExistWrapper;
