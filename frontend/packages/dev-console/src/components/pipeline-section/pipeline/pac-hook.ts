import { useState, useEffect } from 'react';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ConfigMapModel } from '@console/internal/models';
import type { ConfigMapKind } from '@console/internal/module/k8s';
import { k8sList } from '@console/internal/module/k8s';
import { RepositoryModel } from '../../../models/pipelines';

export const PAC_INFO = 'pipelines-as-code-info';
export const PIPELINE_NAMESPACE = 'openshift-pipelines';

export const usePacInfo = () =>
  useK8sGet<ConfigMapKind>(ConfigMapModel, PAC_INFO, PIPELINE_NAMESPACE);

export const useRepositoryPresent = (repoURL: string) => {
  const [repoAlreadyExists, setRepoAlreadyExists] = useState(false);

  useEffect(() => {
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
