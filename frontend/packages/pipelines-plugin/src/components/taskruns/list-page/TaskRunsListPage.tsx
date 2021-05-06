import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { getURLSearchParams } from '@console/internal/components/utils';
import TaskRunsList from './TaskRunsList';
import { TaskRunModel } from '../../../models';
import { runFilters as taskRunFilters } from '../../pipelines/detail-page-tabs/PipelineRuns';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';

interface TaskRunsListPageProps {
  hideBadge?: boolean;
  showPipelineColumn?: boolean;
}

const TaskRunsListPage: React.FC<Omit<
  React.ComponentProps<typeof ListPage>,
  'canCreate' | 'kind' | 'ListComponent' | 'rowFilters'
> &
  TaskRunsListPageProps> = ({ hideBadge, showPipelineColumn = true, namespace, ...props }) => {
  const searchParams = getURLSearchParams();
  const kind = searchParams?.kind;
  const badge = usePipelineTechPreviewBadge(namespace);
  return (
    <ListPage
      {...props}
      customData={{ showPipelineColumn }}
      canCreate={kind?.includes(referenceForModel(TaskRunModel)) ?? false}
      kind={referenceForModel(TaskRunModel)}
      ListComponent={TaskRunsList}
      rowFilters={taskRunFilters}
      badge={hideBadge ? null : badge}
      namespace={namespace}
    />
  );
};
export default TaskRunsListPage;
