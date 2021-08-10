import * as React from 'react';
import i18next from 'i18next';
import { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { coFetch } from '@console/internal/co-fetch';
import { ResourceLink, useAccessReview } from '@console/internal/components/utils';
import { TaskModel } from '../../../models/pipelines';
import { TektonHubCategory, TektonHubTask } from '../../../types/tektonHub';
import { TektonTaskProviders } from '../../pipelines/const';
import { TEKTON_HUB_API_ENDPOINT } from '../const';
import useApiResponse from '../hooks/useApiResponse';

const normalizeTektonHubTasks = async (
  tektonTasks: TektonHubTask[],
  tektonHubCategories: TektonHubCategory[],
): Promise<CatalogItem<TektonHubTask>[]> => {
  const tasks = tektonTasks.reduce((acc, task) => {
    const { id, name } = task;
    const { description } = task.latestVersion;
    const provider = TektonTaskProviders.community;
    const tags = task.tags?.map((t) => t.name);
    const categories = tektonHubCategories
      .filter((c) => c.tags.find((t) => tags.includes(t.name)))
      .map((ct) => ct.name);
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
            icon: {
              node: <ResourceLink kind={TaskModel.kind} />,
            },
            attributes: { installed: '', versions, categories },
            cta: {
              label: i18next.t('pipelines-plugin~Add'),
              callback: () => {},
            },
            data: task,
          };
          return normalizedTektonTask;
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.log(err);
        }),
    );
    return acc;
  }, []);

  const normalizedTektonTasks: CatalogItem<any>[] = await Promise.all(tasks);
  return normalizedTektonTasks;
};

const useTektonHubTasksProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, string] => {
  const [normalizedTasks, setNormalizedTasks] = React.useState<CatalogItem<TektonHubTask>[]>([]);

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

  const [tektonHubCategories, categoryLoaded, categoryError] = useApiResponse<TektonHubCategory>(
    `${TEKTON_HUB_API_ENDPOINT}/categories`,
    canCreateTask && canUpdateTask,
  );
  const [tektonHubTasks, tasksLoaded, tasksError] = useApiResponse<TektonHubTask>(
    `${TEKTON_HUB_API_ENDPOINT}/resources`,
    canCreateTask && canUpdateTask,
  );

  React.useMemo(
    async () =>
      setNormalizedTasks(await normalizeTektonHubTasks(tektonHubTasks, tektonHubCategories)),
    [tektonHubTasks, tektonHubCategories],
  );
  return [normalizedTasks, tasksLoaded && categoryLoaded, tasksError || categoryError];
};

export default useTektonHubTasksProvider;
