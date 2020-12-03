import * as React from 'react';
import * as _ from 'lodash';
import { TFunction } from 'i18next';
import { CatalogItem } from '@console/plugin-sdk';
import { toTitleCase } from '@console/shared';
import { ExternalLink } from '@console/internal/components/utils';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { HelmChartEntries, HelmChartMetaData } from '../../types/helm-types';
import HelmReadmeLoader from '../components/HelmReadmeLoader';

export const normalizeHelmCharts = (
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
            label: t('devconsole~Chart version'),
            value: version,
          },
          {
            label: t('devconsole~App version'),
            value: appVersion,
          },
          {
            label: t('devconsole~Home page'),
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
