import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailsPageProps } from '@console/dynamic-plugin-sdk';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory, viewYamlComponent } from '@console/internal/components/utils';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { useTasksBreadcrumbsFor } from '../pipelines/hooks';
import TaskRunEvents from './events/TaskRunEvents';
import TaskRunDetails from './TaskRunDetails';
import TaskRunLog from './TaskRunLog';

const TaskRunDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const { kind, match } = props;
  const [model] = useK8sModel(kind);

  const breadcrumbsFor = useTasksBreadcrumbsFor(model, match);
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
