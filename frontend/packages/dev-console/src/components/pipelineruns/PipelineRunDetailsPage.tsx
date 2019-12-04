import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory, viewYamlComponent } from '@console/internal/components/utils';
import { pipelineRunStatus } from '../../utils/pipeline-filter-reducer';
import { rerunPipelineRunAndRedirect, stopPipelineRun } from '../../utils/pipeline-actions';
import { PipelineRunDetails } from './detail-page-tabs/PipelineRunDetails';
import { PipelineRunLogsWithActiveTask } from './detail-page-tabs/PipelineRunLogs';

const PipelineRunDetailsPage: React.FC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    menuActions={[rerunPipelineRunAndRedirect, stopPipelineRun, Kebab.factory.Delete]}
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
