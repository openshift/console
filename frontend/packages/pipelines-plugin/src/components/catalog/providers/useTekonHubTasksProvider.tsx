import * as React from 'react';
import { Label } from '@patternfly/react-core';
import i18next from 'i18next';
import { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { ResourceIcon, useAccessReview } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskModel } from '../../../models/pipelines';
import { TektonTaskProviders } from '../../pipelines/const';
import { TektonHubTask, useTektonHubResources } from '../apis/tektonHub';
import { filterBySupportedPlatforms, useTektonHubIntegration } from '../catalog-utils';

const normalizeTektonHubTasks = (tektonHubTasks: TektonHubTask[]): CatalogItem<TektonHubTask>[] => {
  const normalizedTektonHubTasks: CatalogItem<TektonHubTask>[] = tektonHubTasks
    .filter(filterBySupportedPlatforms)
    .reduce((acc, task) => {
      if (task.kind !== TaskModel.kind) {
        return acc;
      }
      const { id, name } = task;
      const { description } = task.latestVersion;
      const provider = TektonTaskProviders.community;
      const tags = task.tags?.map((t) => t.name) ?? [];
      const categories = task.categories?.map((ct) => ct.name) ?? [];
      const [secondaryLabelName] = categories;
      const versions = [];
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
      acc.push(normalizedTektonTask);

      return acc;
    }, []);

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

  const [tektonHubTasks, tasksLoaded, tasksError] = useTektonHubResources(
    canCreateTask && canUpdateTask && integrationEnabled,
  );

  React.useMemo(() => setNormalizedTektonHubTasks(normalizeTektonHubTasks(tektonHubTasks)), [
    tektonHubTasks,
  ]);
  return [normalizedTektonHubTasks, tasksLoaded, tasksError];
};

export default useTektonHubTasksProvider;
