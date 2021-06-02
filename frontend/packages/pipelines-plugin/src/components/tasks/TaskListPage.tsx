import * as React from 'react';
import { DefaultList } from '@console/internal/components/default-resource';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';

interface TaskListPageProps {
  hideBadge?: boolean;
  canCreate?: boolean;
}

const TaskListPage: React.FC<Omit<
  React.ComponentProps<typeof ListPage>,
  'canCreate' | 'kind' | 'ListComponent'
> &
  TaskListPageProps> = ({ hideBadge, ...props }) => {
  const badge = usePipelineTechPreviewBadge(props.namespace);
  return (
    <ListPage
      {...props}
      canCreate={props.canCreate ?? true}
      kind={referenceForModel(TaskModel)}
      ListComponent={DefaultList}
      badge={hideBadge ? null : badge}
    />
  );
};
export default TaskListPage;
