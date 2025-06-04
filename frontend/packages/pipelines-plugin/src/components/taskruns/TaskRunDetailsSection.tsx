import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { TaskRunModel } from '../../models';
import { TaskRunKind } from '../../types';
import TaskRunDetailsStatus from './TaskRunDetailsStatus';

export interface TaskRunDetailsSectionProps {
  taskRun: TaskRunKind;
}

const TaskRunDetailsSection: React.FC<TaskRunDetailsSectionProps> = ({ taskRun }) => {
  const { t } = useTranslation();
  return (
    <>
      <SectionHeading
        text={t('pipelines-plugin~{{taskRunLabel}} details', {
          taskRunLabel: t(TaskRunModel.labelKey),
        })}
      />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={taskRun} />
        </GridItem>
        <GridItem sm={6} className="odc-taskrun-details__status">
          <TaskRunDetailsStatus taskRun={taskRun} />
        </GridItem>
      </Grid>
    </>
  );
};

export default TaskRunDetailsSection;
