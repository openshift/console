import * as React from 'react';
import * as _ from 'lodash';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { K8sResourceKind, k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import { consoleProxyFetchJSON } from '@console/shared/src/utils/proxy';
import { ARTIFACTHUB_API_BASE_URL } from '../../../const';
import { TaskModel, TaskModelV1Beta1 } from '../../../models';
import { TektonTaskAnnotation } from '../../pipelines/const';
import { ARTIFACTHUB } from '../../quicksearch/const';
import { ApiResult } from '../hooks/useApiResponse';

export type ArtifactHubRepository = {
  name: string;
  kind: number;
  url: string;
  display_name: string;
  repository_id: string;
  organization_name: string;
  organization_display_name: string;
};

export type ArtifactHubVersion = {
  version: string;
  contains_security_update: boolean;
  prerelease: boolean;
  ts: number;
};

export type ArtifactHubTask = {
  package_id: string;
  name: string;
  description: string;
  version: string;
  display_name: string;
  repository: ArtifactHubRepository;
};

export type ArtifactHubTaskDetails = {
  package_id: string;
  name: string;
  description: string;
  display_name: string;
  keywords: string[];
  platforms: string[];
  version: ArtifactHubVersion[];
  available_versions: [];
  content_url: string;
  repository: ArtifactHubRepository;
};

const ARTIFACRHUB_TASKS_SEARCH_URL = `${ARTIFACTHUB_API_BASE_URL}/packages/search?offset=0&limit=60&facets=false&kind=7&deprecated=false&sort=relevance`;

export const getArtifactHubTaskDetails = async (
  item: CatalogItem,
  v?: string,
): Promise<ArtifactHubTaskDetails> => {
  const API_BASE_URL = `${ARTIFACTHUB_API_BASE_URL}/packages/tekton-task`;
  const { name, data } = item;
  const {
    task: {
      version,
      repository: { name: repoName },
    },
  } = data;
  const url = `${API_BASE_URL}/${repoName}/${name}/${v || version}`;
  return consoleProxyFetchJSON({ url, method: 'GET' });
};

export const useGetArtifactHubTasks = (hasPermission: boolean): ApiResult<ArtifactHubTask[]> => {
  const [resultData, setResult] = React.useState<ArtifactHubTask[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loadedError, setLoadedError] = React.useState<string>();

  React.useEffect(() => {
    let mounted = true;
    if (hasPermission) {
      consoleProxyFetchJSON<{ packages: ArtifactHubTask[] }>({
        url: ARTIFACRHUB_TASKS_SEARCH_URL,
        method: 'GET',
      })
        .then(({ packages }) => {
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
  return consoleProxyFetchJSON({ url, method: 'GET' })
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
  return consoleProxyFetchJSON({ url, method: 'GET' })
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
