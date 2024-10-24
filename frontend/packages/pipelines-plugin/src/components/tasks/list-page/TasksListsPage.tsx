import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { Page } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { MenuActions, MultiTabListPage } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { TaskModel, ClusterTaskModel, TaskRunModel } from '../../../models';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';
import { FLAG_PIPELINES_OPERATOR_VERSION_1_17_OR_NEWER } from '../../pipelines/const';
import TaskRunsListPage from '../../taskruns/list-page/TaskRunsListPage';
import ClusterTasksPage from './ClusterTasksPage';
import TasksPage from './TasksPage';

const TasksListsPage: React.FC = () => {
  const { t } = useTranslation();
  const IS_PIPELINE_OPERATOR_VERSION_1_17_OR_NEWER = useFlag(
    FLAG_PIPELINES_OPERATOR_VERSION_1_17_OR_NEWER,
  );
  const { ns: namespace } = useParams();
  const badge = usePipelineTechPreviewBadge(namespace);
  const [showTitle, canCreate, hideBadge] = [false, false, true];
  const menuActions: MenuActions = {
    tasks: { model: TaskModel },
    taskRun: { model: TaskRunModel },
    ...(!IS_PIPELINE_OPERATOR_VERSION_1_17_OR_NEWER && {
      clusterTask: { model: ClusterTaskModel },
    }),
  };
  const pages: Page[] = [
    {
      href: '',
      name: t('pipelines-plugin~Tasks'),
      component: TasksPage,
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
    ...(!IS_PIPELINE_OPERATOR_VERSION_1_17_OR_NEWER
      ? [
          {
            href: 'cluster-tasks',
            name: t('pipelines-plugin~ClusterTasks'),
            component: ClusterTasksPage,
            pageData: {
              kind: referenceForModel(ClusterTaskModel),
              canCreate,
              showTitle,
            },
          },
        ]
      : []),
  ];

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <MultiTabListPage
        pages={pages}
        title={t('pipelines-plugin~Tasks')}
        badge={badge}
        menuActions={menuActions}
      />
    </NamespacedPage>
  );
};

export default TasksListsPage;
