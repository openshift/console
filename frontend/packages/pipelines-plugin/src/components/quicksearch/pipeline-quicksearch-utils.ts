import i18n from 'i18next';
import { safeLoad } from 'js-yaml';
import * as _ from 'lodash';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { coFetch } from '@console/internal/co-fetch';
import { k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import { ClusterTaskModel, TaskModel } from '../../models';
import { returnValidTaskModel } from '../../utils/pipeline-utils';
import { TektonTaskAnnotation, TaskProviders } from '../pipelines/const';
import { ARTIFACTHUB, CTALabel, TEKTONHUB } from './const';

export const isSelectedVersionInstalled = (item: CatalogItem, selectedVersion: string): boolean => {
  return item.attributes?.installed === selectedVersion;
};

export const isTaskVersionInstalled = (item: CatalogItem): boolean => !!item.attributes?.installed;

export const isOneVersionInstalled = (item: CatalogItem): boolean => {
  return !!item.attributes?.versions?.find(
    (v) => v.version.toString() === item.attributes?.installed?.toString(),
  );
};

export const isTektonHubTaskWithoutVersions = (item: CatalogItem): boolean => {
  return item.provider === TaskProviders.tektonHub && item?.attributes?.versions?.length === 0;
};

export const isArtifactHubTask = (item: CatalogItem): boolean => {
  return item.data.source === ARTIFACTHUB && item.provider === TaskProviders.artifactHub;
};

export const isSelectedVersionUpgradable = (
  item: CatalogItem,
  selectedVersion: string,
): boolean => {
  return !isSelectedVersionInstalled(item, selectedVersion) && isOneVersionInstalled(item);
};

export const getTaskCtaType = (item: CatalogItem, selectedVersion: string) => {
  return isSelectedVersionInstalled(item, selectedVersion)
    ? CTALabel.Add
    : isSelectedVersionUpgradable(item, selectedVersion)
    ? CTALabel.Update
    : CTALabel.Install;
};

export const getCtaButtonText = (item: CatalogItem, selectedVersion: string): string => {
  const ctaType = getTaskCtaType(item, selectedVersion);
  switch (ctaType) {
    case CTALabel.Add:
      return i18n.t('pipelines-plugin~Add');
    case CTALabel.Install:
      return i18n.t('pipelines-plugin~Install and add');
    case CTALabel.Update:
      return i18n.t('pipelines-plugin~Update and add');
    default:
      throw new Error(`Unknown button type, ${ctaType}`);
  }
};

export const isInstalledNamespaceTask = (item: CatalogItem) => {
  return (
    item.data.kind === TaskModel.kind &&
    item.data.metadata?.annotations?.[TektonTaskAnnotation.installedFrom] === TEKTONHUB
  );
};

export const isExternalTask = (item: CatalogItem) => {
  return !item.data.hasOwnProperty('apiVersion');
};

export const isTaskSearchable = (items: CatalogItem[], item: CatalogItem) => {
  const hasExternalTasks = items.some(isExternalTask);
  return !hasExternalTasks || !isInstalledNamespaceTask(item);
};
export const getInstalledFromAnnotation = () => {
  return { [TektonTaskAnnotation.installedFrom]: TEKTONHUB };
};

export const getSelectedVersionUrl = (item: CatalogItem, version: string): string | null => {
  if (!item?.attributes?.versions) {
    return null;
  }
  return isArtifactHubTask(item)
    ? item.attributes.selectedVersionContentUrl
    : item.attributes.versions.find((v) => v.version === version)?.rawURL;
};

export const findInstalledTask = (items: CatalogItem[], item: CatalogItem): CatalogItem => {
  return items.find(
    (i) =>
      i.uid !== item.uid &&
      i.name === item.name &&
      item.data.kind !== ClusterTaskModel.kind &&
      i.data.kind === TaskModel.kind &&
      (i.data.metadata?.annotations?.[TektonTaskAnnotation.installedFrom] === TEKTONHUB ||
        i.data.metadata?.annotations?.[TektonTaskAnnotation.installedFrom] === ARTIFACTHUB),
  );
};

export const updateTask = async (
  url: string,
  taskData: CatalogItem,
  namespace: string,
  name: string,
) => {
  return coFetch(url)
    .then(async (res) => {
      const yaml = await res.text();
      const task = safeLoad(yaml);
      task.metadata.namespace = namespace;
      task.metadata.annotations = {
        ...task.metadata.annotations,
        ...getInstalledFromAnnotation(),
      };
      task.metadata = _.merge({}, taskData.data.metadata, task.metadata);
      const taskModel = returnValidTaskModel(task);
      return k8sUpdate(taskModel, task, namespace, name);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('Error:', err);
      throw err;
    });
};

export const createTask = (url: string, namespace: string) => {
  return coFetch(url)
    .then(async (res) => {
      const yaml = await res.text();
      const task = safeLoad(yaml);
      task.metadata.namespace = namespace;
      task.metadata.annotations = {
        ...task.metadata.annotations,
        [TektonTaskAnnotation.installedFrom]: TEKTONHUB,
      };
      const taskModel = returnValidTaskModel(task);
      return k8sCreate(taskModel, task);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('Error:', err);
      throw err;
    });
};
