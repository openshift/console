import { useState, useCallback } from 'react';
import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { k8sListResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { settleAllPromises } from '@console/dynamic-plugin-sdk/src/utils/promise';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { usePoll } from '@console/shared/src/hooks/usePoll';
import { FLAG_OPENSHIFT_HELM } from '../const';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../models/helm';

export const hasEnabledHelmCharts = (helmChartRepositories: K8sResourceKind[]): boolean =>
  helmChartRepositories?.some((hcr) => !hcr?.spec?.disabled) || false;

export const useDetectHelmChartRepositories = (setFeatureFlag: SetFeatureFlag) => {
  const [namespace] = useActiveNamespace();
  const [delay, setDelay] = useState<number>(10 * 1000);
  const fetchHelmChartRepositories = useCallback(() => {
    const helmChartRepos: Promise<K8sResourceKind[]>[] = [
      k8sListResource<K8sResourceKind>({
        model: HelmChartRepositoryModel,
        queryParams: {},
      }) as Promise<K8sResourceKind[]>,
      k8sListResource<K8sResourceKind>({
        model: ProjectHelmChartRepositoryModel,
        queryParams: { ns: namespace },
      }) as Promise<K8sResourceKind[]>,
    ];
    settleAllPromises(helmChartRepos)
      .then(([fulfilledValues, rejectedReasons]) => {
        if (fulfilledValues.some((l) => hasEnabledHelmCharts(l))) {
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
