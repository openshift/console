import * as React from 'react';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { safeLoad } from 'js-yaml';
import { coFetch, coFetchJSON } from '@console/internal/co-fetch';
import { HelmChartEntries, HelmChartMetaData } from '../../helm/helm-types';
import { APIError, toTitleCase } from '@console/shared';
import { CatalogItem, CatalogItemDetailsPropertyVariant } from '@console/plugin-sdk';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { HelmChart } from '@console/internal/components/catalog/catalog-page';
import { getActiveNamespace } from '@console/internal/reducers/ui';

const normalizeHelmCharts = (
  chartEntries: HelmChartEntries,
  activeNamespace: string = '',
): CatalogItem[] => {
  return _.reduce(
    chartEntries,
    (normalizedCharts, charts, key) => {
      const chartRepoName = key.split('--').pop();
      charts.forEach((chart: HelmChartMetaData) => {
        const tags = chart.keywords;
        const chartName = chart.name;
        const chartVersion = chart.version;
        const { appVersion } = chart;
        const tileName = `${toTitleCase(chartName)} v${chart.version}`;
        const tileProvider = toTitleCase(chartRepoName);
        const tileDescription = chart.description;
        const tileImgUrl = chart.icon || getImageForIconClass('icon-helm');
        const chartURL = _.get(chart, 'urls.0');
        const encodedChartURL = encodeURIComponent(chartURL);
        const href = `/catalog/helm-install?chartName=${chartName}&chartRepoName=${chartRepoName}&chartURL=${encodedChartURL}&preselected-ns=${activeNamespace}`;

        const markdownDescription = async () => {
          let chartData;
          try {
            chartData = await coFetchJSON(`/api/helm/chart?url=${chartURL}`);
          } catch {
            return null;
          }
          const readmeFile = chartData?.files?.find((file) => file.name === 'README.md');
          const readmeData = readmeFile?.data && atob(readmeFile?.data);
          return readmeData && `## README\n${readmeData}`;
        };

        const detailsProperties = [
          {
            type: CatalogItemDetailsPropertyVariant.TEXT,
            title: 'Chart Version',
            value: chartVersion,
          },
          {
            type: CatalogItemDetailsPropertyVariant.TEXT,
            title: 'App Version',
            value: appVersion || 'N/A',
          },
          {
            type: CatalogItemDetailsPropertyVariant.EXTERNAL_LINK,
            title: 'Home Page',
            value: chart.home,
          },
          {
            type: CatalogItemDetailsPropertyVariant.TEXT,
            title: 'Provider',
            value: tileProvider,
          },
          {
            type: CatalogItemDetailsPropertyVariant.TIMESTAMP,
            title: 'Created At',
            value: chart.created,
          },
        ];

        const detailsDescriptions = [
          {
            type: CatalogItemDetailsPropertyVariant.MARKDOWN,
            title: 'Description',
            value: tileDescription,
          },
          {
            type: CatalogItemDetailsPropertyVariant.ASYNC_MARKDOWN,
            title: 'README',
            value: markdownDescription,
          },
        ];

        const obj = {
          chartRepoName,
          ...chart,
          ...{ metadata: { uid: chart.digest, creationTimestamp: chart.created } },
        };

        const helmChart = {
          type: 'HelmChart',
          name: tileName,
          description: tileDescription,
          provider: tileProvider,
          tags,
          obj,
          icon: {
            class: null,
            url: tileImgUrl,
          },
          cta: {
            label: 'Install Helm Chart',
            href,
          },
          details: {
            properties: detailsProperties,
            descriptions: detailsDescriptions,
          },
        };

        // group Helm chart with same name and different version together
        const existingChartIndex = normalizedCharts.findIndex((hlc) => {
          const currentChart = hlc.obj as HelmChart;
          return currentChart?.name === chartName && currentChart?.chartRepoName === chartRepoName;
        });
        if (existingChartIndex > -1) {
          const existingChart = normalizedCharts[existingChartIndex].obj as HelmChart;
          const versionCompare = helmChart.obj?.version?.localeCompare(
            existingChart?.version,
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

const useHelmCharts = (): [CatalogItem[], boolean, any] => {
  const [helmCharts, setHelmCharts] = React.useState<HelmChartEntries>();
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadedError, setLoadedError] = React.useState<APIError>();

  const activeNamespace = useSelector(getActiveNamespace);

  React.useEffect(() => {
    coFetch('/api/helm/charts/index.yaml')
      .then(async (res) => {
        const yaml = await res.text();
        const json = safeLoad(yaml);
        setHelmCharts(json.entries);
        setLoaded(true);
      })
      .catch(setLoadedError);
  }, []);

  const normalizedHelmCharts: CatalogItem[] = React.useMemo(
    () => normalizeHelmCharts(helmCharts, activeNamespace),
    [activeNamespace, helmCharts],
  );

  return [normalizedHelmCharts, loaded, loadedError];
};

export default useHelmCharts;
