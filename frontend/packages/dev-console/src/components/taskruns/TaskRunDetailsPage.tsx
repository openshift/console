import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory, viewYamlComponent } from '@console/internal/components/utils';
import TaskRunDetails from './TaskRunDetails';
import { useTasksBreadcrumbsFor } from '../pipelines/hooks';

const TaskRunDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, match } = props;
  const breadcrumbsFor = useTasksBreadcrumbsFor(kindObj, match);

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(TaskRunDetails), navFactory.editYaml(viewYamlComponent)]}
    />
  );
};
export default TaskRunDetailsPage;
