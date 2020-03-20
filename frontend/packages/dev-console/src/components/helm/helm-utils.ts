import * as fuzzy from 'fuzzysearch';
import { HelmRelease, HelmReleaseStatus } from './helm-types';
import { coFetchJSON } from '@console/internal/co-fetch';
import {
  CustomResourceListFilterType,
  CustomResourceListRowFilter,
} from '../custom-resource-list/custom-resource-list-types';

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

export const getFilteredItems = (
  items: HelmRelease[],
  filterType: CustomResourceListFilterType,
  filter: string | string[],
) => {
  switch (filterType) {
    case CustomResourceListFilterType.Row:
      return items.filter((release: HelmRelease) => {
        return otherStatuses.includes(release.info.status)
          ? filter.includes(HelmReleaseStatus.Other)
          : filter.includes(release.info.status);
      });
    case CustomResourceListFilterType.Text:
      return items.filter((release: HelmRelease) => fuzzy(filter, release.name));
    default:
      return items;
  }
};

export const getHelmReleaseRevisions = (
  namespace: string,
  name: string,
): Promise<HelmRelease[]> => {
  return coFetchJSON(`/api/helm/release/history?ns=${namespace}&name=${name}`);
};

export const getHelmReleases = (namespace: string): Promise<HelmRelease[]> => {
  return coFetchJSON(`/api/helm/releases?ns=${namespace}`);
};
