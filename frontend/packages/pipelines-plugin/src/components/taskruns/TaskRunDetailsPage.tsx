import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { ArchiveIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory, viewYamlComponent } from '@console/internal/components/utils';
import { TaskRunKind } from '../../types';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { useTaskRun } from '../pipelineruns/hooks/usePipelineRuns';
import { useTasksBreadcrumbsFor } from '../pipelines/hooks';
import TaskRunEvents from './events/TaskRunEvents';
import TaskRunDetails from './TaskRunDetails';
import TaskRunLog from './TaskRunLog';

import './TaskRunDetailsPage.scss';

const TaskRunDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const { kindObj, match, namespace, name } = props;
  const breadcrumbsFor = useTasksBreadcrumbsFor(kindObj, match);
  const badge = usePipelineTechPreviewBadge(props.namespace);
  const [taskRun, loaded, error] = useTaskRun(namespace, name);
  const resourceTitleFunc = (obj: TaskRunKind): string | JSX.Element => {
    return (
      <div className="taskrun-details-page">
        {obj?.metadata?.name}{' '}
        {obj?.metadata?.annotations?.['resource.deleted.in.k8s'] === 'true' && (
          <Tooltip content={t('pipelines-plugin~Archived in Tekton results')}>
            <ArchiveIcon className="pipelinerun-details-page__results-indicator" />
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <DetailsPage
      {...props}
      obj={{
        data: taskRun,
        loaded,
        loadError: error,
      }}
      badge={badge}
      breadcrumbsFor={() => breadcrumbsFor}
      titleFunc={resourceTitleFunc}
      pages={[
        navFactory.details(TaskRunDetails),
        navFactory.editYaml(viewYamlComponent),
        {
          href: 'logs',
          path: 'logs/:name?',
          // t('pipelines-plugin~Logs')
          nameKey: 'pipelines-plugin~Logs',
          component: TaskRunLog,
        },
        navFactory.events(TaskRunEvents),
      ]}
    />
  );
};
export default TaskRunDetailsPage;
