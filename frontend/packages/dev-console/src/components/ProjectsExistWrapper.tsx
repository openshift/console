import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { HintBlock, LoadingBox, FirehoseResult } from '@console/internal/components/utils';
import AddPageLayout from './add/AddPageLayout';

export interface ProjectsExistWrapperProps {
  title: string;
  projects?: FirehoseResult;
  children: React.ReactElement;
}

const ProjectsExistWrapper: React.FC<ProjectsExistWrapperProps> = ({
  title,
  projects,
  children,
}) => {
  const { t } = useTranslation();
  if (!projects.loaded) {
    return <LoadingBox />;
  }

  if (_.isEmpty(projects.data)) {
    return (
      <AddPageLayout
        title={title}
        hintBlock={
          <HintBlock title={t('devconsole~No Projects exist')}>
            <p>
              {t(
                'devconsole~Select one of the following options to create an Application, component or service. As part of the creation process a Project and Application will be created.',
              )}
            </p>
          </HintBlock>
        }
      />
    );
  }

  return children;
};

export default ProjectsExistWrapper;
