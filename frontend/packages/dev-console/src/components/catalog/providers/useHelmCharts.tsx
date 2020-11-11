import * as React from 'react';
import * as _ from 'lodash';
import { safeLoad } from 'js-yaml';
import { coFetch } from '@console/internal/co-fetch';
import { APIError, toTitleCase } from '@console/shared';
import { CatalogExtensionHook, CatalogItem } from '@console/plugin-sdk';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { ExternalLink } from '@console/internal/components/utils';
import { HelmChartEntries, HelmChartMetaData } from '../../helm/helm-types';

const normalizeHelmCharts = (
  chartEntries: HelmChartEntries,
  activeNamespace: string = '',
): CatalogItem[] => {
  return _.reduce(
    chartEntries,
    (normalizedCharts, charts, key) => {
      const chartRepositoryName = key.split('--').pop();
      charts.forEach((chart: HelmChartMetaData) => {
        const { name, digest, created, version, appVersion, description, keywords } = chart;

        const displayName = `${toTitleCase(name)} v${version}`;
        const provider = toTitleCase(chartRepositoryName);
        const imgUrl = chart.icon || getImageForIconClass('icon-helm');
        const chartURL = _.get(chart, 'urls.0');
        const encodedChartURL = encodeURIComponent(chartURL);
        const href = `/catalog/helm-install?chartName=${name}&chartRepoName=${chartRepositoryName}&chartURL=${encodedChartURL}&preselected-ns=${activeNamespace}`;

        const maintainers = chart.maintainers?.length > 0 && (
          <>
            {chart.maintainers?.map((maintainer, index) => (
              <React.Fragment key={index}>
                {maintainer.name}
                <br />
                <a href={`mailto:${maintainer.email}`}>{maintainer.email}</a>
                <br />
              </React.Fragment>
            ))}
          </>
        );

        const homePage = chart.home && (
          <ExternalLink href={chart.home} additionalClassName="co-break-all" text={chart.home} />
        );

        const detailsProperties = [
          {
            label: 'Chart Version',
            value: version,
          },
          {
            label: 'App Version',
            value: appVersion,
          },
          {
            label: 'Home Page',
            value: homePage,
          },
          {
            label: 'Maintainers',
            value: maintainers,
          },
        ];

        const helmChart = {
          uid: digest,
          type: 'HelmChart',
          name: displayName,
          description,
          provider,
          tags: keywords,
          creationTimestamp: created,
          attributes: {
            name,
            chartRepositoryName,
            version,
          },
          icon: {
            class: null,
            url: imgUrl,
          },
          cta: {
            label: 'Install Helm Chart',
            href,
          },
          details: {
            properties: detailsProperties,
          },
        };

        // group Helm chart with same name and different version together
        const existingChartIndex = normalizedCharts.findIndex((currentChart) => {
          return (
            currentChart.attributes?.name === name &&
            currentChart.attributes?.chartRepositoryName === chartRepositoryName
          );
        });

        if (existingChartIndex > -1) {
          const existingChart = normalizedCharts[existingChartIndex];
          const versionCompare = helmChart.attributes?.version?.localeCompare(
            existingChart?.attributes?.version,
            undefined,
            { numeric: true, sensitivity: 'base' },
          );

          if (versionCompare === 1) {
            normalizedCharts[existingChartIndex] = helmChart;
          }
        } else {
          normalizedCharts.push(helmChart);
        }
      });
      return normalizedCharts;
    },
    [] as CatalogItem[],
  );
};

const useHelmCharts: CatalogExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
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
    () => normalizeHelmCharts(helmCharts, namespace),
    [helmCharts, namespace],
  );

  const loaded = !!helmCharts;

  return [normalizedHelmCharts, loaded, loadedError];
};

export default useHelmCharts;
