import * as React from 'react';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { ExtensionHook, CatalogItem, WatchK8sResults } from '@console/dynamic-plugin-sdk';
import { coFetch } from '@console/internal/co-fetch';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { APIError, useActiveNamespace } from '@console/shared';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models';
import { HelmChartEntries } from '../../types/helm-types';
import { normalizeHelmCharts } from '../utils/catalog-utils';

type WatchResource = {
  [key: string]: K8sResourceKind[];
};

const useHelmCharts: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const [activeNamespace] = useActiveNamespace();
  const [helmCharts, setHelmCharts] = React.useState<HelmChartEntries>();
  const [loadedError, setLoadedError] = React.useState<APIError>();

  const resourceSelector = React.useMemo(
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

  React.useEffect(() => {
    let mounted = true;
    coFetch(`/api/helm/charts/index.yaml?namespace=${activeNamespace}`)
      .then(async (res) => {
        if (mounted) {
          const yaml = await res.text();
          const json = safeLoad(yaml);
          setHelmCharts(json.entries);
        }
      })
      .catch((err) => {
        if (mounted) {
          setHelmCharts({});
          setLoadedError(err);
        }
      });
    return () => (mounted = false);
  }, [activeNamespace]);

  const normalizedHelmCharts: CatalogItem[] = React.useMemo(
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
