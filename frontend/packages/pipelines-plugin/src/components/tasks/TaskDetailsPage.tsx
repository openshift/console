import * as React from 'react';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { TaskModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { useTasksBreadcrumbsFor } from '../pipelines/hooks';
import TaskDetails from './TaskDetails';

const TaskDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj } = props;
  const breadcrumbsFor = useTasksBreadcrumbsFor(kindObj);
  const badge = usePipelineTechPreviewBadge(props.namespace);
  const commonActions = useCommonResourceActions(TaskModel, props.obj);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      menuActions={commonActions}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(TaskDetails), navFactory.editYaml()]}
    />
  );
};

export default TaskDetailsPage;
