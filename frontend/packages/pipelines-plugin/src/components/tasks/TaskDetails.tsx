import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { TaskModel } from '../../models';
import { TaskKind } from '../../types';
import WorkspaceDefinitionList from '../shared/workspaces/WorkspaceDefinitionList';

export interface TaskDetailsProps {
  obj: TaskKind;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ obj: task }) => {
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading
        text={t('pipelines-plugin~{{taskLabel}} details', {
          taskLabel: t(TaskModel.labelKey),
        })}
      />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={task} />
        </GridItem>
        <GridItem sm={6} className="odc-task-details__status">
          <WorkspaceDefinitionList workspaces={task.spec.workspaces} />
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export default TaskDetails;
