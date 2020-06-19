import * as React from 'react';
import { match as Rmatch } from 'react-router-dom';
import MultiTabListPage from '../multi-tab-list/MultiTabListPage';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskModel, ClusterTaskModel, TaskRunModel } from '../../models';
import { Page } from '@console/internal/components/utils';
import { TechPreviewBadge } from '@console/shared';
import { DefaultPage } from '@console/internal/components/default-resource';
import TaskRunsListPage from '../taskruns/list-page/TaskRunsListPage';
import { MenuActions } from '../multi-tab-list/multi-tab-list-page-types';

interface TasksListsPageProps {
  match: Rmatch<any>;
}

const TasksListsPage: React.FC<TasksListsPageProps> = ({ match }) => {
  const {
    params: { ns: namespace },
  } = match;
  const [showTitle, canCreate, hideBadge] = [false, false, true];
  const menuActions: MenuActions = {
    tasks: { model: TaskModel },
    taskRun: { model: TaskRunModel },
    clusterTask: { model: ClusterTaskModel },
  };
  const pages: Page[] = [
    {
      href: '',
      name: TaskModel.labelPlural,
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
      name: TaskRunModel.labelPlural,
      component: TaskRunsListPage,
      pageData: {
        hideBadge,
        showTitle,
      },
    },
    {
      href: 'cluster-tasks',
      name: ClusterTaskModel.labelPlural,
      component: DefaultPage,
      pageData: {
        kind: referenceForModel(ClusterTaskModel),
        canCreate,
        showTitle,
      },
    },
  ];

  return (
    <MultiTabListPage
      pages={pages}
      match={match}
      title="Tasks"
      badge={<TechPreviewBadge />}
      menuActions={menuActions}
    />
  );
};

export default TasksListsPage;
