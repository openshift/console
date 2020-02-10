import * as fuzzy from 'fuzzysearch';
import { HelmRelease, HelmReleaseStatus, HelmFilterType } from './helm-types';

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

export const helmRowFilters = [
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
  filterType: HelmFilterType,
  filter: string | string[],
) => {
  switch (filterType) {
    case HelmFilterType.Row:
      return items.filter((release: HelmRelease) => {
        return otherStatuses.includes(release.info.status)
          ? filter.includes(HelmReleaseStatus.Other)
          : filter.includes(release.info.status);
      });
    case HelmFilterType.Text:
      return items.filter((release: HelmRelease) => fuzzy(filter, release.name));
    default:
      return items;
  }
};
