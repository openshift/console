import * as React from 'react';
import isMultiClusterEnabled from '@console/app/src/utils/isMultiClusterEnabled';
import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { settleAllPromises } from '@console/dynamic-plugin-sdk/src/utils/promise';
import { usePoll } from '@console/internal/components/utils/poll-hook';
import { fetchK8s } from '@console/internal/graphql/client';
import { K8sResourceKind, ListKind } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { FLAG_OPENSHIFT_HELM } from '../const';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../models';

export const hasEnabledHelmCharts = (helmChartRepositories: K8sResourceKind[]): boolean =>
  helmChartRepositories?.some((hcr) => !hcr?.spec?.disabled) || false;

export const useDetectHelmChartRepositories = (setFeatureFlag: SetFeatureFlag) => {
  const [namespace] = useActiveNamespace();
  const [delay, setDelay] = React.useState<number>(isMultiClusterEnabled() ? null : 10 * 1000);
  const fetchHelmChartRepositories = React.useCallback(() => {
    if (isMultiClusterEnabled()) {
      setFeatureFlag(FLAG_OPENSHIFT_HELM, false);
      return;
    }
    const helmChartRepos: Promise<ListKind<K8sResourceKind>>[] = [
      fetchK8s<ListKind<K8sResourceKind>>(HelmChartRepositoryModel),
      fetchK8s<ListKind<K8sResourceKind>>(ProjectHelmChartRepositoryModel, null, namespace),
    ];
    settleAllPromises(helmChartRepos)
      .then(([fulfilledValues, rejectedReasons]) => {
        if (fulfilledValues.some((l) => hasEnabledHelmCharts(l?.items))) {
          setFeatureFlag(FLAG_OPENSHIFT_HELM, true);
        } else if (rejectedReasons.length === helmChartRepos.length) {
          const notFound = rejectedReasons.some((e) => e?.response?.status === 404);
          notFound
            ? setFeatureFlag(FLAG_OPENSHIFT_HELM, false)
            : setFeatureFlag(FLAG_OPENSHIFT_HELM, undefined);
          setDelay(null);
        } else {
          setFeatureFlag(FLAG_OPENSHIFT_HELM, false);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.log('failed to fetch helm chart repositories', err);
      });
  }, [namespace, setFeatureFlag]);
  usePoll(fetchHelmChartRepositories, delay);
};
