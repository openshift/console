import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory, viewYamlComponent } from '@console/internal/components/utils';
import TaskRunDetails from './TaskRunDetails';
import TaskRunEvents from './events/TaskRunEvents';
import { useTasksBreadcrumbsFor } from '../pipelines/hooks';
import TaskRunLog from './TaskRunLog';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';

const TaskRunDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const { kindObj, match } = props;
  const breadcrumbsFor = useTasksBreadcrumbsFor(kindObj, match);
  const badge = usePipelineTechPreviewBadge(props.namespace);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[
        navFactory.details(TaskRunDetails),
        navFactory.editYaml(viewYamlComponent),
        {
          href: 'logs',
          path: 'logs/:name?',
          name: t('pipelines-plugin~Logs'),
          component: TaskRunLog,
        },
        navFactory.events(TaskRunEvents),
      ]}
    />
  );
};
export default TaskRunDetailsPage;
