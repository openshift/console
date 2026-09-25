import { useEffect, useRef } from 'react';
import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { k8sListResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { settleAllPromises } from '@console/dynamic-plugin-sdk/src/utils/promise';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { FLAG_OPENSHIFT_HELM } from '../const';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../models/helm';

/**
 * Detects whether the Helm CRDs are installed on the cluster and sets
 * the OPENSHIFT_HELM feature flag accordingly.
 *
 * Detection logic (one-time, no polling):
 *   - CRDs exist (any list call succeeds, even with zero instances) → true
 *   - CRDs exist but RBAC-blocked (any call returns 403) → true
 *   - CRDs absent (all list calls return 404) → false
 *   - Transient errors (all calls fail with non-404/non-403 status) → undefined
 *
 * This does NOT check whether individual HelmChartRepository instances
 * are enabled/disabled — only whether the CRD APIs are reachable.
 * RepositoriesListPage and useHelmCharts reference the CRD models
 * directly and crash on 404 when the CRDs are absent, so the flag
 * must be false in that case.
 */
export const useDetectHelmChartRepositories = (setFeatureFlag: SetFeatureFlag) => {
  const [namespace] = useActiveNamespace();
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) {
      return;
    }
    hasFired.current = true;

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
        if (fulfilledValues.length > 0) {
          // At least one CRD API responded — CRDs are installed.
          setFeatureFlag(FLAG_OPENSHIFT_HELM, true);
        } else if (rejectedReasons.length === helmChartRepos.length) {
          // All calls failed. A 403 (Forbidden) means the API endpoint exists
          // but the user lacks permission — the CRD is installed.
          const hasForbidden = rejectedReasons.some((e) => e?.response?.status === 403);
          if (hasForbidden) {
            setFeatureFlag(FLAG_OPENSHIFT_HELM, true);
          } else {
            const allNotFound = rejectedReasons.every((e) => e?.response?.status === 404);
            if (allNotFound) {
              // Every API returned 404 — CRDs are not installed.
              setFeatureFlag(FLAG_OPENSHIFT_HELM, false);
            } else {
              // Non-404/non-403 errors — transient failure, leave flag undefined
              // so the UI does not permanently hide or show the Helm tab.
              setFeatureFlag(FLAG_OPENSHIFT_HELM, undefined);
            }
          }
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.log('failed to fetch helm chart repositories', err);
      });
  }, [namespace, setFeatureFlag]);
};
