import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { safeDump } from 'js-yaml';
import * as semver from 'semver';
import { coFetchJSON } from '@console/internal/co-fetch';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  HelmRelease,
  HelmChart,
  HelmReleaseStatus,
  HelmChartMetaData,
  HelmActionType,
  HelmActionConfigType,
  HelmActionOrigins,
} from './helm-types';
import { RowFilter } from '@console/internal/components/filter-toolbar';

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

export const helmReleasesRowFilters: RowFilter[] = [
  {
    filterGroupName: 'Status',
    type: 'helm-release-status',
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

export const getChartVersions = (chartEntries: HelmChartMetaData[], kubernetesVersion: string) => {
  const chartVersions = _.reduce(
    chartEntries,
    (obj, chart) => {
      if (
        chart?.kubeVersion &&
        semver.valid(kubernetesVersion) &&
        !semver.satisfies(kubernetesVersion, chart?.kubeVersion)
      ) {
        return obj;
      }
      obj[chart.version] = `${chart.version} / App Version ${chart.appVersion}`;
      return obj;
    },
    {},
  );
  return chartVersions;
};

export const getOriginRedirectURL = (
  actionOrigin: string,
  namespace: string,
  releaseName?: string,
) => {
  switch (actionOrigin) {
    case HelmActionOrigins.topology:
      return `/topology/ns/${namespace}/graph`;
    case HelmActionOrigins.list:
      return `/helm-releases/ns/${namespace}`;
    case HelmActionOrigins.details:
      return `/helm-releases/ns/${namespace}/release/${releaseName}`;
    default:
      return `/helm-releases/ns/${namespace}`;
  }
};

export const getHelmActionConfig = (
  helmAction: HelmActionType,
  releaseName: string,
  namespace: string,
  actionOrigin?: HelmActionOrigins,
  chartURL?: string,
): HelmActionConfigType | undefined => {
  switch (helmAction) {
    case HelmActionType.Install:
      return {
        title: 'Install Helm Chart',
        subTitle: 'The helm chart will be installed using the YAML shown in the editor below.',
        helmReleaseApi: `/api/helm/chart?url=${chartURL}`,
        fetch: coFetchJSON.post,
        redirectURL: getOriginRedirectURL(HelmActionOrigins.topology, namespace, releaseName),
      };
    case HelmActionType.Upgrade:
      return {
        title: 'Upgrade Helm Release',
        subTitle:
          'Upgrade by selecting a new chart version or manually changing the YAML shown in the editor below.',
        helmReleaseApi: `/api/helm/release?ns=${namespace}&name=${releaseName}`,
        fetch: coFetchJSON.put,
        redirectURL: getOriginRedirectURL(actionOrigin, namespace, releaseName),
      };

    case HelmActionType.Rollback:
      return {
        title: 'Rollback Helm Release',
        subTitle: ``,
        helmReleaseApi: `/api/helm/release/history?ns=${namespace}&name=${releaseName}`,
        fetch: coFetchJSON.patch,
        redirectURL: getOriginRedirectURL(actionOrigin, namespace, releaseName),
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

export const getChartValuesYAML = (chart: HelmChart): string => {
  const orderedValuesFile = chart?.files?.find((file) => file.name === 'ordered-values.yaml');
  const orderedValues = orderedValuesFile ? atob(orderedValuesFile.data) : '';

  if (orderedValues) return orderedValues;

  return !_.isEmpty(chart?.values) ? safeDump(chart?.values) : '';
};

export const getHelmChartReadme = (chart: HelmChart): string => {
  const readmeFile = chart?.files?.find((file) => file.name === 'README.md');
  return (readmeFile?.data && atob(readmeFile?.data)) ?? '';
};
