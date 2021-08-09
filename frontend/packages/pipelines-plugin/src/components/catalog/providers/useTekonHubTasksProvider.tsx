import * as React from 'react';
import i18next from 'i18next';
import * as _ from 'lodash';
import { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { coFetch } from '@console/internal/co-fetch';
import { ResourceLink } from '@console/internal/components/utils';
import { TaskKind } from '../../../types';
import { TektonTaskProviders } from '../../pipelines/const';
import { TEKTON_HUB_API_ENDPOINT } from '../const';
import useTaskCategories from '../hooks/useTaskCategories';
import useTaskResources from '../hooks/useTaskResources';

const normalizeTektonHubTasks = async (
  tektonTasks: any[],
  tektonHubCategories: any[],
): Promise<CatalogItem<any>[]> => {
  const tasks = _.reduce(
    tektonTasks,
    (acc, task) => {
      const { id, name, creationTimestamp } = task;
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
            const normalizedTektonTask: CatalogItem<TaskKind> = {
              uid: id,
              type: TektonTaskProviders.community,
              name,
              description,
              provider,
              tags,
              creationTimestamp,
              icon: {
                node: <ResourceLink kind="Task" />,
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
    },
    [],
  );

  const normalizedTektonTasks: CatalogItem<any>[] = await Promise.all(tasks);
  return normalizedTektonTasks;
};

const useTektonHubTasksProvider: ExtensionHook<CatalogItem[]> = (): [
  CatalogItem[],
  boolean,
  string,
] => {
  const [normalizedTasks, setNormalizedTasks] = React.useState<any>([]);

  const [tektonHubCategories, categoryLoaded, categoryError] = useTaskCategories();
  const [tektonHubTasks, tasksLoaded, tasksError] = useTaskResources();

  React.useMemo(
    async () =>
      setNormalizedTasks(await normalizeTektonHubTasks(tektonHubTasks, tektonHubCategories)),
    [tektonHubTasks, tektonHubCategories],
  );
  return [normalizedTasks, tasksLoaded && categoryLoaded, tasksError || categoryError];
};

export default useTektonHubTasksProvider;
