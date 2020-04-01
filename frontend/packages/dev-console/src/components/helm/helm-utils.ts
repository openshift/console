import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { coFetchJSON } from '@console/internal/co-fetch';
import { HelmRelease, HelmReleaseStatus, HelmChartMetaData } from './helm-types';
import { CustomResourceListRowFilter } from '../custom-resource-list/custom-resource-list-types';

export const HelmReleaseStatusLabels = {
  [HelmReleaseStatus.Deployed]: 'Deployed',
  [HelmReleaseStatus.Failed]: 'Failed',
  [HelmReleaseStatus.Other]: 'Other',
};

export const otherStatuses = [
  'unknown',
  'uninstalled',
  'superseded',
  'uninstalling',
  'pending-install',
  'pending-upgrade',
  'pending-rollback',
];

export const releaseStatusReducer = (release: HelmRelease) => {
  if (otherStatuses.includes(release.info.status)) {
    return HelmReleaseStatus.Other;
  }
  return release.info.status;
};

export const selectedStatuses = [
  HelmReleaseStatus.Deployed,
  HelmReleaseStatus.Failed,
  HelmReleaseStatus.Other,
];

export const helmRowFilters: CustomResourceListRowFilter[] = [
  {
    type: 'helm-release-status',
    selected: selectedStatuses,
    reducer: releaseStatusReducer,
    items: selectedStatuses.map((status) => ({
      id: status,
      title: HelmReleaseStatusLabels[status],
    })),
  },
];

export const getFilteredItemsByRow = (items: HelmRelease[], filter: string | string[]) => {
  return items.filter((release: HelmRelease) => {
    return otherStatuses.includes(release.info.status)
      ? filter.includes(HelmReleaseStatus.Other)
      : filter.includes(release.info.status);
  });
};

export const getFilteredItemsByText = (items: HelmRelease[], filter: string) => {
  return items.filter((release: HelmRelease) => fuzzy(filter, release.name));
};

export const fetchHelmReleases = (
  namespace: string,
  helmReleaseName?: string,
): Promise<HelmRelease[]> => {
  const fetchString = `/api/helm/releases?ns=${namespace}${
    helmReleaseName ? `&name=${helmReleaseName}` : ''
  }`;
  return coFetchJSON(fetchString);
};
export const getChartURL = (helmChartData: HelmChartMetaData[], chartVersion: string): string => {
  const chartData: HelmChartMetaData = _.find(helmChartData, (obj) => obj.version === chartVersion);
  return chartData?.urls[0];
};

export const getChartVersions = (chartEntries: HelmChartMetaData[]) => {
  const chartVersions = _.reduce(
    chartEntries,
    (obj, chart) => {
      obj[chart.version] = chart.version;
      return obj;
    },
    {},
  );
  return chartVersions;
};
