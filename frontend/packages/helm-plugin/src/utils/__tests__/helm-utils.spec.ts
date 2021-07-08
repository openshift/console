import { TFunction } from 'i18next';
import {
  mockHelmReleases,
  mockHelmChartData,
  mockReleaseResources,
  flattenedMockReleaseResources,
  mockChartEntries,
  mockRedhatHelmChartData,
  mockHelmChartRepositories,
} from '../../components/__tests__/helm-release-mock-data';
import { HelmRelease, HelmReleaseStatus } from '../../types/helm-types';
import {
  OtherReleaseStatuses,
  releaseStatusReducer,
  filterHelmReleasesByName,
  filterHelmReleasesByStatus,
  getChartURL,
  getChartVersions,
  flattenReleaseResources,
  getChartReadme,
  getChartEntriesByName,
  loadHelmManifestResources,
} from '../helm-utils';

const t = (key: TFunction) => key;

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
    const filteredReleases = filterHelmReleasesByStatus(mockHelmReleases, filter);
    expect(filteredReleases.length).toEqual(2);
    expect(filteredReleases[0].info.status).toBe(HelmReleaseStatus.Deployed);
  });

  it('should return filtered release items with other status for row filters', () => {
    const filter = ['other'];
    const filteredReleases = filterHelmReleasesByStatus(mockHelmReleases, filter);
    expect(filteredReleases.length).toEqual(1);
    expect(OtherReleaseStatuses.includes(filteredReleases[0].info.status)).toBeTruthy();
  });

  it('should return filtered release items for text filter', () => {
    const filteredReleases = filterHelmReleasesByName(mockHelmReleases, 'ghost');
    expect(filteredReleases.length).toEqual(1);
    expect(filteredReleases[0].name).toBe('ghost-test');
  });

  it('should return the helm chart url from ibm repo', () => {
    const chartVersion = '1.0.2';
    const chartRepoName = 'IBM Helm Repo';
    const chartURL = getChartURL(mockHelmChartData, chartVersion, chartRepoName);
    expect(chartURL).toBe(
      'https://raw.githubusercontent.com/IBM/charts/master/repo/community/hazelcast-enterprise-1.0.2.tgz',
    );
  });

  it('should return the helm chart url from redhat repo', () => {
    const chartVersion = '1.0.1';
    const chartRepoName = 'Red Hat Helm Repo';
    const chartURL = getChartURL(mockHelmChartData, chartVersion, chartRepoName);
    expect(chartURL).toBe(
      'https://raw.githubusercontent.com/redhat-helm-charts/master/repo/stable/hazelcast-enterprise-1.0.1.tgz',
    );
  });

  it('should return the chart versions, concatenated with the App Version, available for the helm chart', () => {
    const chartVersions = getChartVersions(mockHelmChartData, t);
    expect(chartVersions).toEqual({
      '1.0.1--IBM Helm Repo':
        '1.0.1helm-plugin~ / App Version {{appVersion}}helm-plugin~ (Provided by {{chartRepoName}})',
      '1.0.1--Red Hat Helm Repo':
        '1.0.1helm-plugin~ / App Version {{appVersion}}helm-plugin~ (Provided by {{chartRepoName}})',
      '1.0.2--IBM Helm Repo': '1.0.2helm-plugin~ (Provided by {{chartRepoName}})',
      '1.0.2--Red Hat Helm Repo': '1.0.2helm-plugin~ (Provided by {{chartRepoName}})',
      '1.0.3--IBM Helm Repo':
        '1.0.3helm-plugin~ / App Version {{appVersion}}helm-plugin~ (Provided by {{chartRepoName}})',
    });
  });

  it('should return chart entries by name from specific repo if repo name provided', () => {
    const chartEntries = getChartEntriesByName(
      mockChartEntries,
      'hazelcast-enterprise',
      'redhat-helm-repo',
      mockHelmChartRepositories,
    );
    expect(chartEntries).toEqual(mockRedhatHelmChartData);
  });

  it('should return chart entries by name from all repos if repo name not provided', () => {
    const chartEntries = getChartEntriesByName(
      mockChartEntries,
      'hazelcast-enterprise',
      '',
      mockHelmChartRepositories,
    );
    expect(chartEntries).toEqual(mockHelmChartData);
  });

  it('should return empty array if wrong chart name or repo name provided', () => {
    expect(
      getChartEntriesByName(
        mockChartEntries,
        'hazelcast-enterprise',
        'stable-helm-repo',
        mockHelmChartRepositories,
      ),
    ).toEqual([]);
    expect(
      getChartEntriesByName(
        mockChartEntries,
        'hazelcast-enterprise-prod',
        '',
        mockHelmChartRepositories,
      ),
    ).toEqual([]);
  });

  it('should omit resources with no data and flatten them', () => {
    expect(flattenReleaseResources(mockReleaseResources)).toEqual(flattenedMockReleaseResources);
  });

  it('should return the readme for the chart provided', () => {
    expect(getChartReadme(mockHelmReleases[0].chart)).toEqual('example readme content');
  });

  describe('loadHelmManifestResources', () => {
    it('should support an empty string', () => {
      expect(loadHelmManifestResources({} as HelmRelease)).toEqual([]);
    });

    it('should filter out empty manifest values', () => {
      expect(loadHelmManifestResources({ manifest: '\n---\n---\n' } as HelmRelease)).toEqual([]);
    });

    it('should support a single helm manifest', () => {
      expect(
        loadHelmManifestResources({
          manifest: `
# Comment
apiVersion: v1
kind: ServiceAccount
metadata:
  name: example-account
`,
        } as HelmRelease),
      ).toEqual([
        {
          apiVersion: 'v1',
          kind: 'ServiceAccount',
          metadata: { name: 'example-account' },
        },
      ]);
    });

    it('should support multiple helm manifests', () => {
      expect(
        loadHelmManifestResources({
          manifest: `
# Comment
apiVersion: v1
kind: ServiceAccount
metadata:
  name: first-account
---
# Another comment
apiVersion: v1
kind: ServiceAccount
metadata:
  name: second-account
`,
        } as HelmRelease),
      ).toEqual([
        {
          apiVersion: 'v1',
          kind: 'ServiceAccount',
          metadata: { name: 'first-account' },
        },
        {
          apiVersion: 'v1',
          kind: 'ServiceAccount',
          metadata: { name: 'second-account' },
        },
      ]);
    });

    // https://bugzilla.redhat.com/show_bug.cgi?id=1866087
    it('should support helm manifests with duplicated keys (invalid json)', () => {
      expect(
        loadHelmManifestResources({
          manifest: `
# Comment
apiVersion: v1
kind: ServiceAccount
metadata:
  name: first
  name: second
`,
        } as HelmRelease),
      ).toEqual([
        {
          apiVersion: 'v1',
          kind: 'ServiceAccount',
          metadata: { name: 'second' },
        },
      ]);
    });
  });
});
