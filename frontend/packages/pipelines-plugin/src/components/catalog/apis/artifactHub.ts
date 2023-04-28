import * as React from 'react';
import { safeLoad } from 'js-yaml';
import * as _ from 'lodash';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/lib-core';
import { k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import { API_PROXY_URL } from '../../../const';
import { TaskModelV1Beta1 } from '../../../models';
import { TektonTaskAnnotation } from '../../pipelines/const';
import { ARTIFACTHUB } from '../../quicksearch/const';
import { getInstalledFromAnnotation } from '../../quicksearch/pipeline-quicksearch-utils';
import { ApiResult } from '../hooks/useApiResponse';

export const getArtifactHubTaskDetails = async (item: CatalogItem): Promise<any> => {
  const API_BASE_URL = 'https://artifacthub.io/api/v1/packages/tekton-task';
  const { name, data } = item;
  const {
    task: {
      version,
      repository: { name: repoName },
    },
  } = data;
  const API_URL = `${API_BASE_URL}/${repoName}/${name}/${version}`;
  const response = await consoleFetchJSON.post(API_PROXY_URL, { url: API_URL, method: 'GET' });
  return response ?? {};
};

export const useGetArtifactHubTasks = (hasPermission: boolean): ApiResult<any> => {
  const [resultData, setResult] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loadedError, setLoadedError] = React.useState<string>();

  const API_URL =
    'https://artifacthub.io/api/v1/packages/search?offset=0&limit=60&facets=false&kind=7&deprecated=false&sort=relevance';

  React.useEffect(() => {
    let mounted = true;
    if (hasPermission) {
      consoleFetchJSON
        .post(API_PROXY_URL, { url: API_URL, method: 'GET' })
        .then((res) => {
          if (mounted) {
            setLoaded(true);
            setResult(JSON.parse(res.body)?.packages);
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

export const createArtifactHubTask = (url: string, namespace: string) => {
  return consoleFetchJSON
    .post(API_PROXY_URL, { url, method: 'GET' })
    .then(async (res) => {
      const task = safeLoad(res.body);
      task.metadata.namespace = namespace;
      task.metadata.annotations = {
        ...task.metadata.annotations,
        [TektonTaskAnnotation.installedFrom]: ARTIFACTHUB,
      };
      await k8sCreate(TaskModelV1Beta1, task);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('Error:', err);
      throw err;
    });
};

export const updateArtifactHubTask = async (
  url: string,
  taskData: CatalogItem,
  namespace: string,
  name: string,
) => {
  return consoleFetchJSON
    .post(API_PROXY_URL, { url, method: 'GET' })
    .then(async (res) => {
      const task = safeLoad(res.body);
      task.metadata.namespace = namespace;
      task.metadata.annotations = {
        ...task.metadata.annotations,
        ...getInstalledFromAnnotation(),
      };
      task.metadata = _.merge({}, taskData.data.metadata, task.metadata);
      return k8sUpdate(TaskModelV1Beta1, task, namespace, name);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('Error:', err);
      throw err;
    });
};
