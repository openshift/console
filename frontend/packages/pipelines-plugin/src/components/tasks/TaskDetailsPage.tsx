import * as React from 'react';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import { useTasksBreadcrumbsFor } from '../pipelines/hooks';
import TaskDetails from './TaskDetails';

const TaskDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, match } = props;
  const breadcrumbsFor = useTasksBreadcrumbsFor(kindObj, match);

  return (
    <DetailsPage
      {...props}
      menuActions={Kebab.factory.common}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(TaskDetails), navFactory.editYaml()]}
    />
  );
};

export default TaskDetailsPage;
