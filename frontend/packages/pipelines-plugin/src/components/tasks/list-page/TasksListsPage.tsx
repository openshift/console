import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as Rmatch } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { DefaultPage } from '@console/internal/components/default-resource';
import { Page } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { MenuActions, MultiTabListPage } from '@console/shared';
import { TaskModel, ClusterTaskModel, TaskRunModel } from '../../../models';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';
import TaskRunsListPage from '../../taskruns/list-page/TaskRunsListPage';

interface TasksListsPageProps {
  match: Rmatch<any>;
}

const TasksListsPage: React.FC<TasksListsPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const {
    params: { ns: namespace },
  } = match;
  const badge = usePipelineTechPreviewBadge(namespace);
  const [showTitle, canCreate, hideBadge] = [false, false, true];
  const menuActions: MenuActions = {
    tasks: { model: TaskModel },
    taskRun: { model: TaskRunModel },
    clusterTask: { model: ClusterTaskModel },
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
      name: t('pipelines-plugin~TaskRuns'),
      component: TaskRunsListPage,
      pageData: {
        hideBadge,
        showTitle,
      },
    },
    {
      href: 'cluster-tasks',
      name: t('pipelines-plugin~ClusterTasks'),
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
        badge={badge}
        menuActions={menuActions}
      />
    </NamespacedPage>
  );
};

export default TasksListsPage;
