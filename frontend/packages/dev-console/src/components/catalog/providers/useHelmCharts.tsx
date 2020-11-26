import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { safeLoad } from 'js-yaml';
import { coFetch, coFetchJSON } from '@console/internal/co-fetch';
import { APIError, toTitleCase } from '@console/shared';
import { CatalogExtensionHook, CatalogItem } from '@console/plugin-sdk';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { ExternalLink } from '@console/internal/components/utils';
import { HelmChartEntries, HelmChartMetaData } from '../../helm/helm-types';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';

type HelmReadmeLoaderProps = {
  chartURL: string;
};

const HelmReadmeLoader: React.FC<HelmReadmeLoaderProps> = ({ chartURL }) => {
  const { t } = useTranslation();
  const [readme, setReadme] = React.useState<string>();
  const [loaded, setLoaded] = React.useState<boolean>(false);

  React.useEffect(() => {
    let unmounted = false;

    const fetchReadme = async () => {
      let chartData;

      try {
        chartData = await coFetchJSON(`/api/helm/chart?url=${chartURL}`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Error fetching helm chart details for readme', e);
      }

      const readmeFile = chartData?.files?.find((file) => file.name === 'README.md');
      const readmeData = readmeFile?.data && atob(readmeFile?.data);

      if (!unmounted) {
        setLoaded(true);
        readmeData && setReadme(t('devconsole~## README\n{{readmeData}}', { readmeData }));
      }
    };

    fetchReadme();

    return () => {
      unmounted = true;
    };
  }, [chartURL, t]);

  if (!loaded) return <div className="loading-skeleton--table" />;

  return <SyncMarkdownView content={readme} emptyMsg={t('devconsole~README not available')} />;
};

const normalizeHelmCharts = (
  chartEntries: HelmChartEntries,
  activeNamespace: string = '',
  t: TFunction,
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
        const chartURL = chart.urls[0];
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
            label: t('devconsole~Chart Version'),
            value: version,
          },
          {
            label: t('devconsole~App Version'),
            value: appVersion,
          },
          {
            label: t('devconsole~Home Page'),
            value: homePage,
          },
          {
            label: t('devconsole~Maintainers'),
            value: maintainers,
          },
        ];

        const detailsDescriptions = [
          {
            value: <p>{description}</p>,
          },
          {
            value: <HelmReadmeLoader chartURL={chartURL} />,
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
            label: t('devconsole~Install Helm Chart'),
            href,
          },
          details: {
            properties: detailsProperties,
            descriptions: detailsDescriptions,
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
