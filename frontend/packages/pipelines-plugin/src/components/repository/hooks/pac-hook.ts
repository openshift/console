import * as React from 'react';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ConfigMapModel } from '@console/internal/models';
import { ConfigMapKind, k8sList } from '@console/internal/module/k8s';
import { RepositoryModel } from '@console/pipelines-plugin/src/models';
import { PAC_INFO } from '../../pac/const';
import { PIPELINE_NAMESPACE } from '../../pipelines/const';

export const usePacInfo = () =>
  useK8sGet<ConfigMapKind>(ConfigMapModel, PAC_INFO, PIPELINE_NAMESPACE);

export const useRepositoryPresent = (repoURL: string) => {
  const [repoAlreadyExists, setRepoAlreadyExists] = React.useState(false);

  React.useEffect(() => {
    k8sList(RepositoryModel)
      .then((repos) => {
        setRepoAlreadyExists(repos.some((r) => r.spec.url === repoURL));
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Error while fetching Pipeline-as-code repositories:', err);
        setRepoAlreadyExists(false);
      });
  }, [repoURL]);

  return repoAlreadyExists;
};
