import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as Rmatch } from 'react-router-dom';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskModel, ClusterTaskModel, TaskRunModel } from '../../../models';
import { Page } from '@console/internal/components/utils';
import { TechPreviewBadge, MenuActions, MultiTabListPage } from '@console/shared';
import { DefaultPage } from '@console/internal/components/default-resource';
import TaskRunsListPage from '../../taskruns/list-page/TaskRunsListPage';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';

interface TasksListsPageProps {
  match: Rmatch<any>;
}

const TasksListsPage: React.FC<TasksListsPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const {
    params: { ns: namespace },
  } = match;
  const [showTitle, canCreate, hideBadge] = [false, false, true];
  const menuActions: MenuActions = {
    tasks: { label: t('pipelines-plugin~Task'), model: TaskModel },
    taskRun: { label: t('pipelines-plugin~Task Run'), model: TaskRunModel },
    clusterTask: { label: t('pipelines-plugin~Cluster Task'), model: ClusterTaskModel },
  };
  const pages: Page[] = [
    {
      href: '',
      name: t('pipelines-plugin~Tasks'),
      component: DefaultPage,
      pageData: {
        kind: referenceForModel(TaskModel),
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'task-runs',
      name: t('pipelines-plugin~Task Runs'),
      component: TaskRunsListPage,
      pageData: {
        hideBadge,
        showTitle,
      },
    },
    {
      href: 'cluster-tasks',
      name: t('pipelines-plugin~Cluster Tasks'),
      component: DefaultPage,
      pageData: {
        kind: referenceForModel(ClusterTaskModel),
        canCreate,
        showTitle,
      },
    },
  ];

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <MultiTabListPage
        pages={pages}
        match={match}
        title={t('pipelines-plugin~Tasks')}
        badge={<TechPreviewBadge />}
        menuActions={menuActions}
      />
    </NamespacedPage>
  );
};

export default TasksListsPage;
