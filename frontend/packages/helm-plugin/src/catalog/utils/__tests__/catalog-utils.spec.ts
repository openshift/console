import { t } from '@console/shared/src/test-utils/i18n-test-utils';
import type { HelmChartEntries } from '../../../types/helm-types';
import { normalizeHelmCharts } from '../catalog-utils';

jest.mock('@console/internal/components/catalog/catalog-item-icon', () => ({
  getImageForIconClass: jest.fn(() => 'test-icon-url'),
}));

describe('normalizeHelmCharts', () => {
  it('should skip chart entries with null urls without throwing', () => {
    const entries: HelmChartEntries = {
      'test-chart--repo': [
        {
          name: 'test-chart',
          version: '1.0.0',
          apiVersion: 'v2',
          urls: null,
        },
      ],
    };
    const result = normalizeHelmCharts(entries, [], '', t);
    expect(result).toEqual([]);
  });

  it('should skip chart entries with undefined urls without throwing', () => {
    const entries: HelmChartEntries = {
      'test-chart--repo': [
        {
          name: 'test-chart',
          version: '1.0.0',
          apiVersion: 'v2',
        },
      ],
    };
    const result = normalizeHelmCharts(entries, [], '', t);
    expect(result).toEqual([]);
  });

  it('should skip chart entries with empty urls array without throwing', () => {
    const entries: HelmChartEntries = {
      'test-chart--repo': [
        {
          name: 'test-chart',
          version: '1.0.0',
          apiVersion: 'v2',
          urls: [],
        },
      ],
    };
    const result = normalizeHelmCharts(entries, [], '', t);
    expect(result).toEqual([]);
  });

  it('should normalize chart entries with valid urls', () => {
    const entries: HelmChartEntries = {
      'test-chart--repo': [
        {
          name: 'test-chart',
          version: '1.0.0',
          apiVersion: 'v2',
          urls: ['https://example.com/charts/test-chart-1.0.0.tgz'],
          description: 'A test chart',
        },
      ],
    };
    const result = normalizeHelmCharts(entries, [], '', t);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Chart');
    expect(result[0].type).toBe('HelmChart');
  });

  it('should skip entries with null urls while keeping entries with valid urls', () => {
    const entries: HelmChartEntries = {
      'alaz--repo': [
        {
          name: 'alaz',
          version: '0.5.0',
          apiVersion: 'v2',
          description: 'Valid chart',
          urls: ['https://example.com/alaz-0.5.0.tgz'],
        },
        {
          name: 'alaz',
          version: '9.9.9',
          apiVersion: 'v2',
          description: 'Newer version with NO urls key',
          urls: null,
        },
      ],
      'beta--repo': [
        {
          name: 'beta',
          version: '1.0.0',
          apiVersion: 'v2',
          description: 'Chart with no urls at all',
        },
      ],
    };
    const result = normalizeHelmCharts(entries, [], '', t);
    expect(result).toHaveLength(1);
    expect(result[0].attributes.name).toBe('alaz');
    expect(result[0].attributes.version).toBe('0.5.0');
  });
});
