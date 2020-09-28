import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { KebabAction, navFactory, viewYamlComponent } from '@console/internal/components/utils';
import { pipelineRunStatus } from '../../utils/pipeline-filter-reducer';
import { getPipelineRunKebabActions } from '../../utils/pipeline-actions';
import { PipelineRunDetails } from './detail-page-tabs/PipelineRunDetails';
import { PipelineRunLogsWithActiveTask } from './detail-page-tabs/PipelineRunLogs';
import { useMenuActionsWithUserAnnotation } from './triggered-by';

const PipelineRunDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const menuActions: KebabAction[] = useMenuActionsWithUserAnnotation(
    getPipelineRunKebabActions(true),
  );

  return (
    <DetailsPage
      {...props}
      menuActions={menuActions}
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
};

export default PipelineRunDetailsPage;
