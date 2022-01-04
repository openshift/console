import * as React from 'react';
import { Label } from '@patternfly/react-core';
import i18next from 'i18next';
import { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { coFetch } from '@console/internal/co-fetch';
import { ResourceIcon, useAccessReview } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskModel } from '../../../models/pipelines';
import { TektonHubTask } from '../../../types/tektonHub';
import { TektonTaskProviders } from '../../pipelines/const';
import { filterBySupportedPlatforms, useTektonHubIntegration } from '../catalog-utils';
import { TEKTON_HUB_API_ENDPOINT } from '../const';
import useApiResponse from '../hooks/useApiResponse';

const normalizeTektonHubTasks = async (
  tektonHubTasks: TektonHubTask[],
): Promise<CatalogItem<TektonHubTask>[]> => {
  const tasks = tektonHubTasks.filter(filterBySupportedPlatforms).reduce((acc, task) => {
    if (task.kind !== TaskModel.kind) {
      return acc;
    }
    const { id, name } = task;
    const { description } = task.latestVersion;
    const provider = TektonTaskProviders.community;
    const tags = task.tags?.map((t) => t.name) ?? [];
    const categories = task.categories?.map((ct) => ct.name) ?? [];
    const [secondaryLabelName] = categories;
    acc.push(
      coFetch(`${TEKTON_HUB_API_ENDPOINT}/resource/${id}/versions`)
        .then(async (res) => {
          const json = await res.json();
          const versions = json.data?.versions ?? [];
          const normalizedTektonTask: CatalogItem<TektonHubTask> = {
            uid: id.toString(),
            type: TektonTaskProviders.community,
            name,
            description,
            provider,
            tags,
            secondaryLabel: secondaryLabelName && <Label color="blue">{secondaryLabelName}</Label>,
            icon: {
              node: <ResourceIcon kind={referenceForModel(TaskModel)} />,
            },
            attributes: { installed: '', versions, categories },
            cta: {
              label: i18next.t('pipelines-plugin~Add'),
            },
            data: task,
          };
          return normalizedTektonTask;
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.log('Failed to fetch tekton hub resource', err);
        }),
    );
    return acc;
  }, []);

  const normalizedTektonHubTasks: CatalogItem<any>[] = await Promise.all(tasks);
  return normalizedTektonHubTasks;
};

const useTektonHubTasksProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, string] => {
  const [normalizedTektonHubTasks, setNormalizedTektonHubTasks] = React.useState<
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

  const integrationEnabled = useTektonHubIntegration();

  const [tektonHubTasks, tasksLoaded, tasksError] = useApiResponse<TektonHubTask>(
    `${TEKTON_HUB_API_ENDPOINT}/resources`,
    canCreateTask && canUpdateTask && integrationEnabled,
  );

  React.useMemo(
    async () => setNormalizedTektonHubTasks(await normalizeTektonHubTasks(tektonHubTasks)),
    [tektonHubTasks],
  );
  return [normalizedTektonHubTasks, tasksLoaded, tasksError];
};

export default useTektonHubTasksProvider;
