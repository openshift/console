import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { safeLoad } from 'js-yaml';
import { coFetch } from '@console/internal/co-fetch';
import { APIError } from '@console/shared';
import { CatalogExtensionHook, CatalogItem } from '@console/plugin-sdk';
import { HelmChartEntries } from '../../types/helm-types';
import { normalizeHelmCharts } from '../utils/catalog-utils';

const useHelmCharts: CatalogExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const [helmCharts, setHelmCharts] = React.useState<HelmChartEntries>();
  const [loadedError, setLoadedError] = React.useState<APIError>();

  React.useEffect(() => {
    coFetch('/api/helm/charts/index.yaml')
      .then(async (res) => {
        const yaml = await res.text();
        const json = safeLoad(yaml);
        setHelmCharts(json.entries);
      })
      .catch(setLoadedError);
  }, []);

  const normalizedHelmCharts: CatalogItem[] = React.useMemo(
    () => normalizeHelmCharts(helmCharts, namespace, t),
    [helmCharts, namespace, t],
  );

  const loaded = !!helmCharts;

  return [normalizedHelmCharts, loaded, loadedError];
};

export default useHelmCharts;
