import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory, viewYamlComponent } from '@console/internal/components/utils';
import TaskRunDetails from './TaskRunDetails';

const TaskRunDetailsPage: React.FC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    pages={[navFactory.details(TaskRunDetails), navFactory.editYaml(viewYamlComponent)]}
  />
);
export default TaskRunDetailsPage;
