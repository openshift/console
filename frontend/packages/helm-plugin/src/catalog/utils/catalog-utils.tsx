import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import {
  CatalogItem,
  CatalogItemDetailsDescription,
  CatalogItemDetailsProperty,
} from '@console/dynamic-plugin-sdk';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { toTitleCase } from '@console/shared';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import certifiedIcon from '../../../icons/certified.svg';
import { HelmChartEntries, HelmChartMetaData } from '../../types/helm-types';
import { getChartRepositoryTitle } from '../../utils/helm-utils';
import HelmReadmeLoader from '../components/HelmReadmeLoader';
import {
  CHART_NAME_ANNOTATION,
  PROVIDER_TYPE,
  PROVIDER_TYPE_ANNOTATION,
  PROVIDER_TYPE_KEYS,
  PROVIDER_NAME_ANNOTATION,
  SUPPORT_URL_ANNOTATION,
} from './const';

export const normalizeHelmCharts = (
  chartEntries: HelmChartEntries,
  chartRepositories: K8sResourceKind[],
  activeNamespace: string = '',
  t: TFunction,
): CatalogItem[] => {
  return _.reduce(
    chartEntries,
    (normalizedCharts, charts, key) => {
      const chartRepoName = key.split('--').pop();
      const chartRepositoryTitle = getChartRepositoryTitle(chartRepositories, chartRepoName);

      charts.forEach((chart: HelmChartMetaData) => {
        const { name, created, version, appVersion, description, keywords, annotations } = chart;

        const annotatedName = annotations?.[CHART_NAME_ANNOTATION] ?? '';
        const providerType = annotations?.[PROVIDER_TYPE_ANNOTATION] ?? '';
        const providerName = annotations?.[PROVIDER_NAME_ANNOTATION] ?? '';
        const supportUrl = annotations?.[SUPPORT_URL_ANNOTATION] ?? '';
        const displayName = annotatedName || `${toTitleCase(name)}`;
        const imgUrl = chart.icon || getImageForIconClass('icon-helm');
        const chartURL = chart.urls[0];
        const encodedChartURL = encodeURIComponent(chartURL);
        const encodedChartRepoName = encodeURIComponent(chartRepoName);
        const encodedChartName = encodeURIComponent(name);
        const encodedChartIndexKey = encodeURIComponent(key);
        const href = `/catalog/helm-install?chartName=${encodedChartName}&chartRepoName=${encodedChartRepoName}&chartURL=${encodedChartURL}&preselected-ns=${activeNamespace}&indexEntry=${encodedChartIndexKey}`;

        const translatedProviderType = PROVIDER_TYPE_KEYS[providerType]
          ? t(PROVIDER_TYPE_KEYS[providerType])
          : _.capitalize(providerType);

        const title =
          providerType === PROVIDER_TYPE.partner ? (
            <>
              <span style={{ verticalAlign: 'middle' }}>{displayName}</span>{' '}
              <Tooltip
                content={t(
                  'helm-plugin~This Helm Chart is provided by a trusted partner and has been verified for ease of integration.',
                )}
              >
                <img src={certifiedIcon} alt={t('helm-plugin~Certified')} />
              </Tooltip>
            </>
          ) : null;

        const maintainers = chart.maintainers?.length > 0 && (
          <>
            {chart.maintainers?.map((maintainer, index) => (
              // eslint-disable-next-line react/no-array-index-key
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
          <ExternalLink href={chart.home} className="co-break-all" text={chart.home} />
        );

        const detailsProperties: CatalogItemDetailsProperty[] = [
          {
            label: t('helm-plugin~Latest Chart version'),
            value: version,
          },
          {
            label: t('helm-plugin~Product version'),
            value: appVersion,
          },
          {
            label: t('helm-plugin~Source'),
            value: translatedProviderType,
          },
          {
            label: t('helm-plugin~Provider'),
            value: providerName,
          },
          {
            label: t('helm-plugin~Home page'),
            value: homePage,
          },
          {
            label: t('helm-plugin~Repository'),
            value: chartRepositoryTitle,
          },
          {
            label: t('helm-plugin~Maintainers'),
            value: maintainers,
          },
          {
            label: t('helm-plugin~Documentation'),
            value: '',
            isHidden: true,
          },
        ];

        const detailsDescriptions: CatalogItemDetailsDescription[] = [
          {
            label: t('helm-plugin~Description'),
            value: <p>{description}</p>,
          },
          {
            value: (
              <HelmReadmeLoader
                chartURL={chartURL}
                namespace={activeNamespace}
                chartIndexEntry={key}
              />
            ),
          },
        ];

        const helmChart: CatalogItem = {
          uid: `${chartRepoName}--${chartURL}`,
          type: 'HelmChart',
          name: displayName,
          title,
          description,
          provider: providerName,
          tags: keywords,
          creationTimestamp: created,
          attributes: {
            name,
            chartRepositoryTitle,
            version,
            providerType: translatedProviderType,
          },
          icon: {
            class: null,
            url: imgUrl,
          },
          cta: {
            label: t('helm-plugin~Create'),
            href,
          },
          details: {
            properties: detailsProperties,
            descriptions: detailsDescriptions,
          },
          supportUrl,
        };

        // group Helm chart with same name and different version together
        const existingChartIndex = normalizedCharts.findIndex((currentChart) => {
          return (
            (currentChart.attributes?.name === name &&
              currentChart.attributes?.chartRepositoryTitle === chartRepositoryTitle) ||
            (currentChart.name === annotatedName && currentChart.provider === providerName)
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
