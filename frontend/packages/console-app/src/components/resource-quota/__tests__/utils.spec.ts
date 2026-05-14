import { getUsedPercentage, getLabelAndUsage } from '../utils';

jest.mock('@console/internal/components/utils/units', () => ({
  convertToBaseValue: jest.fn((val: string) => {
    // Handle common unit suffixes
    if (val.endsWith('Gi')) {
      return parseFloat(val) * 1024 * 1024 * 1024;
    }
    if (val.endsWith('Mi')) {
      return parseFloat(val) * 1024 * 1024;
    }
    if (val.endsWith('Ki')) {
      return parseFloat(val) * 1024;
    }
    if (val.endsWith('m')) {
      return parseFloat(val) / 1000;
    }
    // Return null for plain numbers to trigger parseInt fallback
    const num = parseFloat(val);
    return Number.isNaN(num) ? null : num;
  }),
  humanizePercentage: jest.fn((percent: number) => ({
    string: `${percent.toFixed(0)}%`,
  })),
}));

describe('utils', () => {
  describe('getUsedPercentage', () => {
    it('should return 0 when hard is undefined', () => {
      expect(getUsedPercentage(undefined, '10')).toBe(0);
    });

    it('should return 0 when used is undefined', () => {
      expect(getUsedPercentage('100', undefined)).toBe(0);
    });

    it('should return 0 when both values are undefined', () => {
      expect(getUsedPercentage(undefined, undefined)).toBe(0);
    });

    it('should calculate percentage for plain numbers', () => {
      const result = getUsedPercentage('100', '50');
      expect(result).toBe(50);
    });

    it('should calculate percentage for values with units', () => {
      const result = getUsedPercentage('2Gi', '1Gi');
      expect(result).toBe(50);
    });

    it('should return 0 when calculated values are invalid', () => {
      const result = getUsedPercentage('invalid', 'invalid');
      expect(result).toBe(0);
    });
  });

  describe('getLabelAndUsage', () => {
    it('should return count format for count/ prefixed resources', () => {
      const result = getLabelAndUsage({
        resourceName: 'count/deployments.apps',
        used: '5',
        hard: '10',
      });

      expect(result.label).toBe('5 of 10');
      expect(result.percent).toBe(50);
    });

    it('should return count format for pods (generic count resource)', () => {
      const result = getLabelAndUsage({
        resourceName: 'pods',
        used: '3',
        hard: '10',
      });

      expect(result.label).toBe('3 of 10');
      expect(result.percent).toBe(30);
    });

    it('should return count format for secrets (generic count resource)', () => {
      const result = getLabelAndUsage({
        resourceName: 'secrets',
        used: '8',
        hard: '20',
      });

      expect(result.label).toBe('8 of 20');
      expect(result.percent).toBe(40);
    });

    it('should return percentage format for memory resources', () => {
      const result = getLabelAndUsage({
        resourceName: 'limits.memory',
        used: '1Gi',
        hard: '2Gi',
      });

      expect(result.label).toBe('50%');
      expect(result.percent).toBe(50);
    });

    it('should return percentage format for cpu resources', () => {
      const result = getLabelAndUsage({
        resourceName: 'limits.cpu',
        used: '500m',
        hard: '1000m',
      });

      expect(result.label).toBe('50%');
      expect(result.percent).toBe(50);
    });

    it('should handle missing used value with 0', () => {
      const result = getLabelAndUsage({
        resourceName: 'pods',
        used: '',
        hard: '10',
      });

      expect(result.label).toBe('0 of 10');
      expect(result.percent).toBe(0);
    });
  });
});
