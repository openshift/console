import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailsPageProps } from '@console/dynamic-plugin-sdk';
import { DetailsPage } from '@console/internal/components/factory';
import { KebabAction, navFactory, viewYamlComponent } from '@console/internal/components/utils';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { getPipelineRunKebabActions } from '../../utils/pipeline-actions';
import { pipelineRunStatus } from '../../utils/pipeline-filter-reducer';
import { usePipelinesBreadcrumbsFor } from '../pipelines/hooks';
import { PipelineRunDetails } from './detail-page-tabs/PipelineRunDetails';
import { PipelineRunLogsWithActiveTask } from './detail-page-tabs/PipelineRunLogs';
import TaskRuns from './detail-page-tabs/TaskRuns';
import PipelineRunEvents from './events/PipelineRunEvents';
import { useMenuActionsWithUserAnnotation } from './triggered-by';

const PipelineRunDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const { kind, match } = props;
  const [model] = useK8sModel(kind);
  const menuActions: KebabAction[] = useMenuActionsWithUserAnnotation(
    getPipelineRunKebabActions(true),
  );
  const breadcrumbsFor = usePipelinesBreadcrumbsFor(model, match);
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
          name: t('pipelines-plugin~TaskRuns'),
          component: TaskRuns,
        },
        {
          href: 'logs',
          path: 'logs/:name?',
          name: t('pipelines-plugin~Logs'),
          component: PipelineRunLogsWithActiveTask,
        },
        navFactory.events(PipelineRunEvents),
      ]}
    />
  );
};

export default PipelineRunDetailsPage;
