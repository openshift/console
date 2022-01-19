import * as React from 'react';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { ExtensionHook, CatalogItem, WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { coFetch } from '@console/internal/co-fetch';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { APIError, useActiveNamespace } from '@console/shared';
import { HelmChartRepositoryModel } from '../../models';
import { HelmChartEntries } from '../../types/helm-types';
import { normalizeHelmCharts } from '../utils/catalog-utils';

const useHelmCharts: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const [activeNamespace] = useActiveNamespace();
  const [helmCharts, setHelmCharts] = React.useState<HelmChartEntries>();
  const [loadedError, setLoadedError] = React.useState<APIError>();

  const resourceSelector: WatchK8sResource = {
    isList: true,
    kind: referenceForModel(HelmChartRepositoryModel),
  };

  const [chartRepositories, chartRepositoriesLoaded] = useK8sWatchResource<K8sResourceKind[]>(
    resourceSelector,
  );

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
    () => normalizeHelmCharts(helmCharts, chartRepositories, namespace, t),
    [chartRepositories, helmCharts, namespace, t],
  );

  const loaded = !!helmCharts && chartRepositoriesLoaded;

  return [normalizedHelmCharts, loaded, loadedError];
};

export default useHelmCharts;
