import * as React from 'react';
import { getBadgeFromType } from '@console/shared';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { getURLSearchParams } from '@console/internal/components/utils';
import TaskRunsList from './TaskRunsList';
import { TaskRunModel } from '../../../models';
import { runFilters as taskRunFilters } from '../../pipelines/detail-page-tabs/PipelineRuns';

interface TaskRunsListPageProps {
  hideBadge?: boolean;
  showPipelineColumn?: boolean;
}

const TaskRunsListPage: React.FC<Omit<
  React.ComponentProps<typeof ListPage>,
  'canCreate' | 'kind' | 'ListComponent' | 'rowFilters'
> &
  TaskRunsListPageProps> = ({ hideBadge, showPipelineColumn = true, ...props }) => {
  const searchParams = getURLSearchParams();
  const kind = searchParams?.kind;

  return (
    <ListPage
      {...props}
      customData={{ showPipelineColumn }}
      canCreate={kind?.includes(referenceForModel(TaskRunModel)) ?? false}
      kind={referenceForModel(TaskRunModel)}
      ListComponent={TaskRunsList}
      rowFilters={taskRunFilters}
      badge={hideBadge ? null : getBadgeFromType(TaskRunModel.badge)}
    />
  );
};
export default TaskRunsListPage;
