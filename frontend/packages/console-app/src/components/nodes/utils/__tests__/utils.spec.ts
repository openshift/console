// Assisted-by: Claude
import { parseDurationToSeconds } from '../utils';

describe('utils', () => {
  describe('parseDurationToSeconds', () => {
    it('should return undefined for empty or invalid input', () => {
      expect(parseDurationToSeconds('')).toBeUndefined();
      expect(parseDurationToSeconds('  ')).toBeUndefined();
      expect(parseDurationToSeconds(undefined)).toBeUndefined();
      expect(parseDurationToSeconds('invalid')).toBeUndefined();
      expect(parseDurationToSeconds('12x')).toBeUndefined();
      expect(parseDurationToSeconds('5m30x')).toBeUndefined();
    });

    it('should parse seconds correctly', () => {
      expect(parseDurationToSeconds('300s')).toBe(300);
      expect(parseDurationToSeconds('300')).toBe(300);
      expect(parseDurationToSeconds('60s')).toBe(60);
      expect(parseDurationToSeconds('0s')).toBe(0);
    });

    it('should parse minutes correctly', () => {
      expect(parseDurationToSeconds('5m')).toBe(300);
      expect(parseDurationToSeconds('1m')).toBe(60);
    });

    it('should parse hours correctly', () => {
      expect(parseDurationToSeconds('1h')).toBe(3600);
      expect(parseDurationToSeconds('2h')).toBe(7200);
    });

    it('should parse days correctly', () => {
      expect(parseDurationToSeconds('1d')).toBe(86400);
      expect(parseDurationToSeconds('2d')).toBe(172800);
    });

    it('should be case-insensitive', () => {
      expect(parseDurationToSeconds('5M')).toBe(300);
      expect(parseDurationToSeconds('1H')).toBe(3600);
      expect(parseDurationToSeconds('1D')).toBe(86400);
    });

    it('should parse compound Kubernetes-style durations', () => {
      expect(parseDurationToSeconds('5m30s')).toBe(330);
      expect(parseDurationToSeconds('1h10m')).toBe(4200);
      expect(parseDurationToSeconds('2d3h4m5s')).toBe(183845);
    });
  });
});
