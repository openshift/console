import { t } from '@console/shared/src/test-utils/i18n-test-utils';
import type { HelmChartMetaData, HelmChartEntries } from '../../../types/helm-types';
import { normalizeHelmCharts } from '../catalog-utils';

jest.mock('@console/internal/components/catalog/catalog-item-icon', () => ({
  getImageForIconClass: jest.fn(() => 'test-icon-url'),
}));

const validChart: HelmChartMetaData = {
  name: 'test-chart',
  version: '1.0.0',
  apiVersion: 'v1',
  description: 'A test chart',
  urls: ['https://example.com/charts/test-chart-1.0.0.tgz'],
};

describe('normalizeHelmCharts', () => {
  it('should skip charts with undefined urls', () => {
    const malformedChart = { ...validChart, urls: undefined } as unknown as HelmChartMetaData;
    const entries: HelmChartEntries = {
      'test--repo': [malformedChart],
    };
    const result = normalizeHelmCharts(entries, [], 'default', t);
    expect(result).toHaveLength(0);
  });

  it('should skip charts with empty urls array', () => {
    const malformedChart: HelmChartMetaData = { ...validChart, urls: [] };
    const entries: HelmChartEntries = {
      'test--repo': [malformedChart],
    };
    const result = normalizeHelmCharts(entries, [], 'default', t);
    expect(result).toHaveLength(0);
  });

  it('should normalize charts with valid urls', () => {
    const entries: HelmChartEntries = {
      'test-chart--repo': [validChart],
    };
    const result = normalizeHelmCharts(entries, [], 'default', t);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Chart');
    expect(result[0].type).toBe('HelmChart');
  });

  it('should skip malformed entries while keeping valid ones', () => {
    const malformedChart = {
      ...validChart,
      name: 'bad',
      urls: undefined,
    } as unknown as HelmChartMetaData;
    const entries: HelmChartEntries = {
      'charts--repo': [malformedChart, validChart],
    };
    const result = normalizeHelmCharts(entries, [], 'default', t);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Chart');
  });

  it('should handle null chartEntries', () => {
    const result = normalizeHelmCharts(null, [], 'default', t);
    expect(result).toHaveLength(0);
  });

  it('should handle undefined chartEntries', () => {
    const result = normalizeHelmCharts(undefined, [], 'default', t);
    expect(result).toHaveLength(0);
  });
});
