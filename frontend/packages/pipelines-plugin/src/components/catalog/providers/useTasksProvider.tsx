import * as React from 'react';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskModel, ClusterTaskModel } from '../../../models';
import { TaskKind } from '../../../types';
import { TektonTaskAnnotation, TektonTaskLabel } from '../../pipelines/const';

const normalizeTektonTasks = (TektonTasks: TaskKind[], t: TFunction): CatalogItem<TaskKind>[] => {
  const normalizedTektonTasks: CatalogItem<TaskKind>[] = _.reduce(
    TektonTasks,
    (acc, task) => {
      const { uid, name, annotations = {}, creationTimestamp, labels = {} } = task.metadata;
      const { description } = task?.spec;
      const tags = (annotations[TektonTaskAnnotation.tags] || '').split(/\s*,\s*/);
      const provider = labels[TektonTaskLabel.providerType];
      const iconClass = 'icon-build';
      const imgUrl = getImageForIconClass(iconClass);

      const normalizedTektonTask: CatalogItem<TaskKind> = {
        uid,
        type: 'Tekton',
        name,
        description,
        provider,
        tags,
        creationTimestamp,
        icon: {
          url: imgUrl,
          class: iconClass,
        },
        cta: {
          label: t('pipelines-plugin~Add'),
          callback: () => {},
        },
        data: task,
      };
      acc.push(normalizedTektonTask);
      return acc;
    },
    [],
  );

  return normalizedTektonTasks;
};

const useTasks: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, string] => {
  const { t } = useTranslation();

  const { namespacedTasks, clusterTasks } = useK8sWatchResources<{
    namespacedTasks: TaskKind[];
    clusterTasks: TaskKind[];
  }>({
    namespacedTasks: {
      kind: referenceForModel(TaskModel),
      isList: true,
      namespace,
    },
    clusterTasks: {
      kind: referenceForModel(ClusterTaskModel),
      isList: true,
      namespaced: false,
    },
  });
  const namespacedTaskData = namespacedTasks.loaded ? namespacedTasks.data : [];
  const clusterTaskData = clusterTasks.loaded ? clusterTasks.data : [];

  const tektonTasks = React.useMemo(() => _.filter([...namespacedTaskData, ...clusterTaskData]), [
    namespacedTaskData,
    clusterTaskData,
  ]);

  const normalizedTektonTasks = React.useMemo(() => normalizeTektonTasks(tektonTasks, t), [
    tektonTasks,
    t,
  ]);

  return [
    normalizedTektonTasks,
    namespacedTasks.loaded && clusterTasks.loaded,
    namespacedTasks.loadError || clusterTasks.loadError,
  ];
};

export default useTasks;
