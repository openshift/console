import * as React from 'react';
import i18next from 'i18next';
import { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { ResourceIcon, useAccessReview } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskModel } from '../../../models/pipelines';
import { TaskProviders } from '../../pipelines/const';
import { ARTIFACTHUB } from '../../quicksearch/const';
import { ArtifactHubTask, useGetArtifactHubTasks } from '../apis/artifactHub';
import { TektonHubTask } from '../apis/tektonHub';
import { useTektonHubIntegration } from '../catalog-utils';

const normalizeArtifactHubTasks = (artifactHubTasks: ArtifactHubTask[]): CatalogItem<any>[] => {
  const normalizedArtifactHubTasks: CatalogItem<ArtifactHubTask>[] = artifactHubTasks.reduce(
    (acc, task) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { package_id, name, description } = task;
      const provider = TaskProviders.artifactHub;
      const normalizedArtifactHubTask: CatalogItem<any> = {
        uid: package_id.toString(),
        type: TaskProviders.community,
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
          source: ARTIFACTHUB,
        },
      };
      acc.push(normalizedArtifactHubTask);

      return acc;
    },
    [],
  );

  return normalizedArtifactHubTasks;
};

const useArtifactHubTasksProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, string] => {
  const artifactHubIntegration = useTektonHubIntegration();
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

  const [artifactHubTasks, tasksLoaded, tasksError] = useGetArtifactHubTasks(
    canCreateTask && canUpdateTask && artifactHubIntegration,
  );
  const normalizedArtifactHubTasks = React.useMemo<CatalogItem<TektonHubTask>[]>(
    () => normalizeArtifactHubTasks(artifactHubTasks),
    [artifactHubTasks],
  );
  return [normalizedArtifactHubTasks, tasksLoaded, tasksError];
};

export default useArtifactHubTasksProvider;
