import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { coFetchJSON } from '@console/internal/co-fetch';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  HelmRelease,
  HelmReleaseStatus,
  HelmChartMetaData,
  HelmActionType,
  HelmActionConfigType,
} from './helm-types';
import { CustomResourceListRowFilter } from '../custom-resource-list/custom-resource-list-types';

export const HelmReleaseStatusLabels = {
  [HelmReleaseStatus.Deployed]: 'Deployed',
  [HelmReleaseStatus.Failed]: 'Failed',
  [HelmReleaseStatus.Other]: 'Other',
};

export const SelectedReleaseStatuses = [
  HelmReleaseStatus.Deployed,
  HelmReleaseStatus.Failed,
  HelmReleaseStatus.Other,
];

export const OtherReleaseStatuses = [
  'unknown',
  'uninstalled',
  'superseded',
  'uninstalling',
  'pending-install',
  'pending-upgrade',
  'pending-rollback',
];

export const releaseStatusReducer = (release: HelmRelease) => {
  if (OtherReleaseStatuses.includes(release.info.status)) {
    return HelmReleaseStatus.Other;
  }
  return release.info.status;
};

export const helmReleasesRowFilters: CustomResourceListRowFilter[] = [
  {
    type: 'helm-release-status',
    selected: SelectedReleaseStatuses,
    reducer: releaseStatusReducer,
    items: SelectedReleaseStatuses.map((status) => ({
      id: status,
      title: HelmReleaseStatusLabels[status],
    })),
  },
];

export const filterHelmReleasesByStatus = (releases: HelmRelease[], filter: string | string[]) => {
  return releases.filter((release: HelmRelease) => {
    return OtherReleaseStatuses.includes(release.info.status)
      ? filter.includes(HelmReleaseStatus.Other)
      : filter.includes(release.info.status);
  });
};

export const filterHelmReleasesByName = (releases: HelmRelease[], filter: string) => {
  return releases.filter((release: HelmRelease) => fuzzy(filter, release.name));
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

export const getHelmActionConfig = (
  helmAction: HelmActionType,
  releaseName: string,
  namespace: string,
  chartURL: string,
): HelmActionConfigType | undefined => {
  switch (helmAction) {
    case HelmActionType.Install:
      return {
        title: 'Install Helm Chart',
        subTitle: 'The helm chart will be installed using the YAML shown in the editor below.',
        helmReleaseApi: `/api/helm/chart?url=${chartURL}`,
        fetch: coFetchJSON.post,
        redirectURL: `/topology/ns/${namespace}`,
      };
    case HelmActionType.Upgrade:
      return {
        title: 'Upgrade Helm Release',
        subTitle: '',
        helmReleaseApi: `/api/helm/release?ns=${namespace}&release_name=${releaseName}`,
        fetch: coFetchJSON.put,
        redirectURL: `/helm-releases/ns/${namespace}`,
      };
    default:
      return undefined;
  }
};

export const flattenReleaseResources = (resources: { [kind: string]: { data: K8sResourceKind } }) =>
  Object.keys(resources).reduce((acc, kind) => {
    if (!_.isEmpty(resources[kind].data)) {
      acc.push(resources[kind].data);
    }
    return acc;
  }, []);
