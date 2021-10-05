import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { safeLoad } from 'js-yaml';
import { coFetch } from '@console/internal/co-fetch';
import { APIError } from '@console/shared';
import { ExtensionHook, CatalogItem } from '@console/dynamic-plugin-sdk';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { HelmChartEntries } from '../../types/helm-types';
import { normalizeHelmCharts } from '../utils/catalog-utils';
import { HelmChartRepositoryModel } from '../../models';

const useHelmCharts: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
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
    coFetch('/api/helm/charts/index.yaml')
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
  }, []);

  const normalizedHelmCharts: CatalogItem[] = React.useMemo(
    () => normalizeHelmCharts(helmCharts, chartRepositories, namespace, t),
    [chartRepositories, helmCharts, namespace, t],
  );

  const loaded = !!helmCharts && chartRepositoriesLoaded;

  return [normalizedHelmCharts, loaded, loadedError];
};

export default useHelmCharts;
