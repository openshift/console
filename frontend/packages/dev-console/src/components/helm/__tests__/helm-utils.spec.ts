import * as _ from 'lodash';
import {
  OtherReleaseStatuses,
  releaseStatusReducer,
  filterHelmReleasesByName,
  filterHelmReleasesByStatus,
  getChartURL,
  getChartVersions,
  flattenReleaseResources,
  getHelmChartReadme,
} from '../helm-utils';
import { HelmReleaseStatus } from '../helm-types';
import {
  mockHelmReleases,
  mockHelmChartData,
  mockHelmChartData2,
  mockReleaseResources,
  flattenedMockReleaseResources,
} from './helm-release-mock-data';

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

  it('should return the helm chart url', () => {
    const chartVersion = '1.0.2';
    const chartURL = getChartURL(mockHelmChartData, chartVersion);
    expect(chartURL).toBe(
      'https://raw.githubusercontent.com/IBM/charts/master/repo/community/hazelcast-enterprise-1.0.2.tgz',
    );
  });

  it('should return the chart versions, concatenated with the App Version, available for the helm chart', () => {
    const chartVersions = getChartVersions(mockHelmChartData, 'v1.18.2+ui678hjj');
    expect(chartVersions).toEqual({
      '1.0.1': '1.0.1 / App Version 3.10.5',
      '1.0.2': '1.0.2 / App Version 3.12',
      '1.0.3': '1.0.3 / App Version 3.12',
    });
  });

  it('should concatenate App Version with the Chart Version only when it is available', () => {
    const chartVersions = getChartVersions(mockHelmChartData2, 'v1.18.2');
    expect(chartVersions).toEqual({
      '1.0.2': '1.0.2',
      '1.0.3': '1.0.3 / App Version 3.12',
    });
  });

  it('should omit resources with no data and flatten them', () => {
    expect(flattenReleaseResources(mockReleaseResources)).toEqual(flattenedMockReleaseResources);
  });

  it('should filter the chart versions which are incompatible with the kubernetes version', () => {
    let kubernetesVersion = 'v1.18.0';
    mockHelmChartData[2].kubeVersion = '>=1.25.0';
    let chartVersions = getChartVersions(mockHelmChartData, kubernetesVersion);
    const expectedChartVersions = {
      '1.0.1': '1.0.1 / App Version 3.10.5',
      '1.0.2': '1.0.2 / App Version 3.12',
      '1.0.3': '1.0.3 / App Version 3.12',
    };
    expect(chartVersions).toEqual(_.omit(expectedChartVersions, '1.0.1'));

    kubernetesVersion = '-';
    chartVersions = getChartVersions(mockHelmChartData, kubernetesVersion);
    expect(chartVersions).toEqual(expectedChartVersions);

    kubernetesVersion = 'unknown';
    chartVersions = getChartVersions(mockHelmChartData, kubernetesVersion);
    expect(chartVersions).toEqual(expectedChartVersions);

    kubernetesVersion = 'v1.18.3+e1ba7b6';
    chartVersions = getChartVersions(mockHelmChartData, kubernetesVersion);
    expect(chartVersions).toEqual(_.omit(expectedChartVersions, '1.0.1'));

    kubernetesVersion = 'v1.20.3-alpha.1';
    mockHelmChartData[2].kubeVersion = '>=1.20.3-0';
    chartVersions = getChartVersions(mockHelmChartData, kubernetesVersion);
    expect(chartVersions).toEqual(_.omit(expectedChartVersions, '1.0.2'));

    kubernetesVersion = 'v1.20.3-alpha.1';
    mockHelmChartData[2].kubeVersion = '>=1.19.3-0';
    chartVersions = getChartVersions(mockHelmChartData, kubernetesVersion);
    expect(chartVersions).toEqual({
      '1.0.3': '1.0.3 / App Version 3.12',
    });

    kubernetesVersion = 'v1.18.3+8uinj';
    mockHelmChartData[0].kubeVersion = '>1.14.1';
    mockHelmChartData[2].kubeVersion = '>= 1.13.0 < 1.14.0 || >= 1.14.1 < 1.15.0';
    chartVersions = getChartVersions(mockHelmChartData, kubernetesVersion);
    expect(chartVersions).toEqual(_.omit(expectedChartVersions, '1.0.1'));
  });

  it('should return the readme for the chart provided', () => {
    expect(getHelmChartReadme(mockHelmReleases[0].chart)).toEqual('example readme content');
  });
});
