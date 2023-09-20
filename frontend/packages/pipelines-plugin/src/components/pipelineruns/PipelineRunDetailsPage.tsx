import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { KebabAction, navFactory, viewYamlComponent } from '@console/internal/components/utils';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { getPipelineRunKebabActions } from '../../utils/pipeline-actions';
import { pipelineRunStatus } from '../../utils/pipeline-filter-reducer';
import { useDevPipelinesBreadcrumbsFor } from '../pipelines/hooks';
import { usePipelineOperatorVersion } from '../pipelines/utils/pipeline-operator';
import { useTaskRuns } from '../taskruns/useTaskRuns';
import { PipelineRunDetails } from './detail-page-tabs/PipelineRunDetails';
import { PipelineRunLogsWithActiveTask } from './detail-page-tabs/PipelineRunLogs';
import TaskRuns from './detail-page-tabs/TaskRuns';
import PipelineRunEvents from './events/PipelineRunEvents';
import PipelineRunParametersForm from './PipelineRunParametersForm';
import { useMenuActionsWithUserAnnotation } from './triggered-by';

const PipelineRunDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, match } = props;
  const operatorVersion = usePipelineOperatorVersion(props.namespace);
  const [taskRuns] = useTaskRuns(props.namespace);
  const menuActions: KebabAction[] = useMenuActionsWithUserAnnotation(
    getPipelineRunKebabActions(operatorVersion, taskRuns, true),
  );
  const breadcrumbsFor = useDevPipelinesBreadcrumbsFor(kindObj, match);
  const badge = usePipelineTechPreviewBadge(props.namespace);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      menuActions={menuActions}
      getResourceStatus={pipelineRunStatus}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[
        navFactory.details(PipelineRunDetails),
        navFactory.editYaml(viewYamlComponent),
        {
          href: 'task-runs',
          // t('pipelines-plugin~TaskRuns')
          nameKey: 'pipelines-plugin~TaskRuns',
          component: TaskRuns,
        },
        {
          href: 'parameters',
          // t('pipelines-plugin~Parameters')
          nameKey: 'pipelines-plugin~Parameters',
          component: (pageProps) => (
            <PipelineRunParametersForm obj={pageProps.obj} {...pageProps} />
          ),
        },
        {
          href: 'logs',
          path: 'logs/:name?',
          // t('pipelines-plugin~Logs')
          nameKey: 'pipelines-plugin~Logs',
          component: PipelineRunLogsWithActiveTask,
        },
        navFactory.events(PipelineRunEvents),
      ]}
    />
  );
};

export default PipelineRunDetailsPage;
