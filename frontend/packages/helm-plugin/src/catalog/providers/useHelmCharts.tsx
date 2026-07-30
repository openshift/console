import { useState, useMemo, useEffect, useRef } from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import type { ExtensionHook, CatalogItem, WatchK8sResults } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { useToast } from '@console/shared/src/components/toast/useToast';
import type { APIError } from '@console/shared/src/types/resource';
import { coFetch } from '@console/shared/src/utils/console-fetch';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models/helm';
import type { HelmChartEntries } from '../../types/helm-types';
import { normalizeHelmCharts } from '../utils/catalog-utils';

type WatchResource = {
  [key: string]: K8sResourceKind[];
};

const useHelmCharts: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation('helm-plugin');
  const toast = useToast();
  const [helmCharts, setHelmCharts] = useState<HelmChartEntries>();
  const [loadedError, setLoadedError] = useState<APIError>();
  const shownWarningRef = useRef<string>();

  const resourceSelector = useMemo(
    () => ({
      hcrs: {
        isList: true,
        kind: referenceForModel(HelmChartRepositoryModel),
      },
      phcrs: {
        isList: true,
        kind: referenceForModel(ProjectHelmChartRepositoryModel),
        namespace,
      },
    }),
    [namespace],
  );

  const chartRepositories: WatchK8sResults<WatchResource> = useK8sWatchResources<WatchResource>(
    resourceSelector,
  );

  const chartRepositoriesLoaded =
    Object.keys(chartRepositories).length > 0 &&
    Object.values(chartRepositories).some((value) => value.loaded || !!value.loadError);

  const namespaceParam = namespace ? `?namespace=${namespace}` : '';
  useEffect(() => {
    let mounted = true;
    coFetch(`/api/helm/charts/index.yaml${namespaceParam}`)
      .then(async (res) => {
        if (mounted) {
          const yaml = await res.text();
          const json = safeLoad(yaml) as {
            entries: HelmChartEntries;
            annotations?: Record<string, string>;
          };
          setHelmCharts(json.entries);
          const warningData = json.annotations?.['console-warning'];
          const sessionKey = 'helm-repo-warning-shown';
          if (
            warningData &&
            warningData !== shownWarningRef.current &&
            warningData !== sessionStorage.getItem(sessionKey)
          ) {
            shownWarningRef.current = warningData;
            try {
              sessionStorage.setItem(sessionKey, warningData);
            } catch {
              // sessionStorage may be unavailable
            }
            try {
              const repos: { name: string; error: string }[] = JSON.parse(warningData);
              const repoList = repos.map((r) => `${r.name}: ${r.error}`).join(', ');
              toast.addToast({
                variant: AlertVariant.danger,
                title: t('Helm Chart repository error'),
                content: t('The following repositories are unreachable: {{repoList}}', {
                  repoList,
                }),
                dismissible: true,
                timeout: false,
              });
            } catch {
              // ignore malformed annotation
            }
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          setHelmCharts({});
          setLoadedError(err);
        }
      });
    return () => {
      mounted = false;
    };
  }, [namespaceParam, toast, t]);

  const normalizedHelmCharts: CatalogItem[] = useMemo(
    () =>
      normalizeHelmCharts(
        helmCharts,
        [...chartRepositories?.hcrs?.data, ...chartRepositories?.phcrs?.data],
        namespace,
        t,
      ),
    [chartRepositories, helmCharts, namespace, t],
  );

  const loaded = !!helmCharts && chartRepositoriesLoaded;

  return [normalizedHelmCharts, loaded, loadedError];
};

export default useHelmCharts;
