import {
  releaseStatusReducer,
  getFilteredItemsByRow,
  otherStatuses,
  getFilteredItemsByText,
} from '../helm-utils';
import { HelmReleaseStatus } from '../helm-types';
import { mockHelmReleases } from './helm-release-mock-data';

describe('Helm Releases Utils', () => {
  it('should return deployed or failed status for a helm release', () => {
    const release = mockHelmReleases[0];
    expect(releaseStatusReducer(release)).toEqual(HelmReleaseStatus.Deployed);
  });

  it('should return other for all other statuses for a helm release', () => {
    const release = mockHelmReleases[2];
    expect(releaseStatusReducer(release)).toEqual(HelmReleaseStatus.Other);
  });

  it('should return filtered release items with deployed and failed status for row filters', () => {
    const filter = ['deployed', 'failed'];
    const filteredReleases = getFilteredItemsByRow(mockHelmReleases, filter);
    expect(filteredReleases.length).toEqual(2);
    expect(filteredReleases[0].info.status).toBe(HelmReleaseStatus.Deployed);
  });

  it('should return filtered release items with other status for row filters', () => {
    const filter = ['other'];
    const filteredReleases = getFilteredItemsByRow(mockHelmReleases, filter);
    expect(filteredReleases.length).toEqual(1);
    expect(otherStatuses.includes(filteredReleases[0].info.status)).toBeTruthy();
  });

  it('should return filtered release items for text filter', () => {
    const filteredReleases = getFilteredItemsByText(mockHelmReleases, 'ghost');
    expect(filteredReleases.length).toEqual(1);
    expect(filteredReleases[0].name).toBe('ghost-test');
  });
});
