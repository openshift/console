import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory, viewYamlComponent } from '@console/internal/components/utils';
import { pipelineRunStatus } from '../../utils/pipeline-filter-reducer';
import { rerunPipelineAndRedirect, stopPipelineRun } from '../../utils/pipeline-actions';
import { PipelineRunDetails } from './PipelineRunDetails';
import { PipelineRunLogsWithActiveTask } from './PipelineRunLogs';

const PipelineRunDetailsPage: React.FC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    menuActions={[rerunPipelineAndRedirect, stopPipelineRun, Kebab.factory.Delete]}
    getResourceStatus={pipelineRunStatus}
    pages={[
      navFactory.details(PipelineRunDetails),
      navFactory.editYaml(viewYamlComponent),
      {
        href: 'logs',
        path: 'logs/:name?',
        name: 'Logs',
        component: PipelineRunLogsWithActiveTask,
      },
    ]}
  />
);
export default PipelineRunDetailsPage;
