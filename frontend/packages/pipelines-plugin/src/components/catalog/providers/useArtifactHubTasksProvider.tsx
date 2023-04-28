import * as React from 'react';
import i18next from 'i18next';
import { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { ResourceIcon, useAccessReview } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskModel } from '../../../models/pipelines';
import { TektonTaskProviders } from '../../pipelines/const';
import { useGetArtifactHubTasks } from '../apis/artifactHub';
import { TektonHubTask } from '../apis/tektonHub';

const normalizeArtifactHubTasks = (tektonHubTasks: any[]): CatalogItem<any>[] => {
  const normalizedTektonHubTasks: CatalogItem<any>[] = tektonHubTasks.reduce((acc, task) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { package_id, name, description } = task;
    const provider = TektonTaskProviders.community;
    const normalizedArtifactHubTask: CatalogItem<any> = {
      uid: package_id.toString(),
      type: TektonTaskProviders.community,
      name,
      description,
      provider,
      icon: {
        node: <ResourceIcon kind={referenceForModel(TaskModel)} />,
      },
      attributes: { installed: '' },
      cta: {
        label: i18next.t('pipelines-plugin~Add'),
      },
      data: {
        task,
        source: 'artifactHub',
      },
    };
    acc.push(normalizedArtifactHubTask);

    return acc;
  }, []);

  return normalizedTektonHubTasks;
};

const useArtifactHubTasksProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, string] => {
  const [normalizedArtifactHubTasks, setNormalizedArtifactHubTasks] = React.useState<
    CatalogItem<TektonHubTask>[]
  >([]);

  const canCreateTask = useAccessReview({
    group: TaskModel.apiGroup,
    resource: TaskModel.plural,
    namespace,
    verb: 'create',
  });

  const canUpdateTask = useAccessReview({
    group: TaskModel.apiGroup,
    resource: TaskModel.plural,
    namespace,
    verb: 'update',
  });

  const [tektonHubTasks, tasksLoaded, tasksError] = useGetArtifactHubTasks(
    canCreateTask && canUpdateTask,
  );
  React.useMemo(() => setNormalizedArtifactHubTasks(normalizeArtifactHubTasks(tektonHubTasks)), [
    tektonHubTasks,
  ]);
  return [normalizedArtifactHubTasks, tasksLoaded, tasksError];
};

export default useArtifactHubTasksProvider;
