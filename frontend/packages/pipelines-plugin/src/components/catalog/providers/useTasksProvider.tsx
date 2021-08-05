import * as React from 'react';
import { useFormikContext } from 'formik';
import i18next from 'i18next';
import * as _ from 'lodash';
import { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { TaskKind } from '../../../types';
import { TektonTaskAnnotation, TektonTaskLabel } from '../../pipelines/const';
import { PipelineBuilderFormikValues } from '../../pipelines/pipeline-builder/types';

const normalizeTektonTasks = (tektonTasks: TaskKind[]): CatalogItem<TaskKind>[] => {
  const normalizedTektonTasks: CatalogItem<TaskKind>[] = _.reduce(
    tektonTasks,
    (acc, task) => {
      const { uid, name, annotations = {}, creationTimestamp, labels = {} } = task.metadata;
      const { description } = task.spec;
      const tags = (annotations[TektonTaskAnnotation.tags] || '').split(/\s*,\s*/);
      const provider = labels[TektonTaskLabel.providerType];
      const iconClass = 'icon-build';
      const imgUrl = getImageForIconClass(iconClass);

      const normalizedTektonTask: CatalogItem<TaskKind> = {
        uid,
        type: 'Red Hat',
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
          label: i18next.t('pipelines-plugin~Add'),
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

const useTasksProvider: ExtensionHook<CatalogItem[]> = (): [CatalogItem[], boolean, string] => {
  const { values, status } = useFormikContext<PipelineBuilderFormikValues>();
  const {
    taskResources: { namespacedTasks, clusterTasks, tasksLoaded },
  } = values;

  const tektonTasks = React.useMemo(() => _.filter([...namespacedTasks, ...clusterTasks]), [
    namespacedTasks,
    clusterTasks,
  ]);

  const normalizedTektonTasks = React.useMemo(() => normalizeTektonTasks(tektonTasks), [
    tektonTasks,
  ]);
  return [normalizedTektonTasks, tasksLoaded, status?.taskLoadingError];
};

export default useTasksProvider;
