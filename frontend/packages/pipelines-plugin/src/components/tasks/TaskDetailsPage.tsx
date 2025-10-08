import * as React from 'react';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { LazyActionMenu } from '@console/shared/src';
import { TaskModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { useTasksBreadcrumbsFor } from '../pipelines/hooks';
import TaskDetails from './TaskDetails';

const TaskDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj } = props;
  const breadcrumbsFor = useTasksBreadcrumbsFor(kindObj);
  const badge = usePipelineTechPreviewBadge(props.namespace);

  return (
    <DetailsPage
      {...props}
      kind={referenceForModel(TaskModel)}
      badge={badge}
      customActionMenu={(obj) => (
        <LazyActionMenu context={{ [referenceForModel(TaskModel)]: obj }} {...props} />
      )}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(TaskDetails), navFactory.editYaml()]}
    />
  );
};

export default TaskDetailsPage;
