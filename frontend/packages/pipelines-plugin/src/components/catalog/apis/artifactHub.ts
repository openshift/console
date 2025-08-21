import { useState, useEffect } from 'react';
import * as _ from 'lodash';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { K8sResourceKind, k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import { GITHUB_BASE_URL } from '../../../const';
import { TaskModel, TaskModelV1Beta1 } from '../../../models';
import { TektonTaskAnnotation } from '../../pipelines/const';
import { ARTIFACTHUB } from '../../quicksearch/const';
import { ApiResult } from '../hooks/useApiResponse';
import {
  ArtifactHubTask,
  ArtifactHubTaskDetails,
  getTaskDetails,
  getTaskYAMLFromGithub,
  searchTasks,
} from './utils';

export const getArtifactHubTaskDetails = async (
  item: CatalogItem,
  v?: string,
): Promise<ArtifactHubTaskDetails> => {
  const { name, data } = item;
  const {
    task: {
      version,
      repository: { name: repoName },
    },
  } = data;

  return getTaskDetails({ repoName, name, version: v || version });
};

export const useGetArtifactHubTasks = (hasPermission: boolean): ApiResult<ArtifactHubTask[]> => {
  const [resultData, setResult] = useState<ArtifactHubTask[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadedError, setLoadedError] = useState<string>();

  useEffect(() => {
    let mounted = true;
    if (hasPermission) {
      searchTasks()
        .then((packages) => {
          if (mounted) {
            setLoaded(true);
            setResult(packages);
          }
        })
        .catch((err) => {
          if (mounted) {
            setLoaded(true);
            setLoadedError(err?.message);
          }
        });
    } else {
      setLoaded(true);
    }
    return () => {
      mounted = false;
    };
  }, [hasPermission]);
  return [resultData, loaded, loadedError];
};

export const createArtifactHubTask = (url: string, namespace: string, version: string) => {
  const yamlPath = url.startsWith(GITHUB_BASE_URL) ? url.slice(GITHUB_BASE_URL.length) : null;
  if (!yamlPath) {
    throw new Error('Not a valid GitHub URL');
  }

  return getTaskYAMLFromGithub({ yamlPath })
    .then((task: K8sResourceKind) => {
      task.metadata.namespace = namespace;
      task.metadata.annotations = {
        ...task.metadata.annotations,
        [TektonTaskAnnotation.installedFrom]: ARTIFACTHUB,
        [TektonTaskAnnotation.semVersion]: version,
      };
      return k8sCreate(task.apiVersion === 'tekton.dev/v1' ? TaskModel : TaskModelV1Beta1, task);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('Error while importing ArtifactHub Task:', err);
      throw err;
    });
};

export const updateArtifactHubTask = async (
  url: string,
  taskData: CatalogItem,
  namespace: string,
  name: string,
  version: string,
) => {
  const yamlPath = url.startsWith(GITHUB_BASE_URL) ? url.slice(GITHUB_BASE_URL.length) : null;
  if (!yamlPath) {
    throw new Error('Not a valid GitHub raw URL');
  }

  return getTaskYAMLFromGithub({ yamlPath })
    .then((task: K8sResourceKind) => {
      task.metadata.namespace = namespace;
      task.metadata.annotations = {
        ...task.metadata.annotations,
        [TektonTaskAnnotation.semVersion]: version,
      };
      task.metadata = _.merge({}, taskData.data.metadata, task.metadata);
      return k8sUpdate(
        task.apiVersion === 'tekton.dev/v1' ? TaskModel : TaskModelV1Beta1,
        task,
        namespace,
        name,
      );
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('Error while updating ArtifactHub Task:', err);
      throw err;
    });
};
