import * as React from 'react';
import { getBadgeFromType } from '@console/shared';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import TaskRunsList from './TaskRunsList';
import { TaskRunModel } from '../../../models';
import { runFilters as taskRunFilters } from '../../pipelines/detail-page-tabs/PipelineRuns';

interface TaskRunsListPageProps {
  hideBadge?: boolean;
}

const TaskRunsListPage: React.FC<Omit<
  React.ComponentProps<typeof ListPage>,
  'canCreate' | 'kind' | 'ListComponent' | 'rowFilters'
> &
  TaskRunsListPageProps> = (props) => {
  return (
    <ListPage
      {...props}
      canCreate={false}
      kind={referenceForModel(TaskRunModel)}
      ListComponent={TaskRunsList}
      rowFilters={taskRunFilters}
      badge={props.hideBadge ? null : getBadgeFromType(TaskRunModel.badge)}
    />
  );
};

export default TaskRunsListPage;
