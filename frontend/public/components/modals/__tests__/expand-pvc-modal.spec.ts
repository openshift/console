import { convertToBaseValue } from '../../utils/units';
import {
  getInitialExpandSize,
  getMinValueInSelectedUnit,
  isExpandSizeValid,
} from '../expand-pvc-modal';

describe('expand-pvc-modal helpers', () => {
  describe('getInitialExpandSize', () => {
    it('humanizes API-canonical Mi Quantities to match PVC details (1536Mi → 1.5Gi)', () => {
      expect(getInitialExpandSize('1536Mi')).toEqual({ value: '1.5', unit: 'Gi' });
    });

    it('keeps decimal Gi requests in Gi', () => {
      expect(getInitialExpandSize('1.5Gi')).toEqual({ value: '1.5', unit: 'Gi' });
    });

    it('humanizes unitless byte Quantities into a supported binary unit', () => {
      const initial = getInitialExpandSize('1073741824');
      expect(initial.unit).toBe('Gi');
      expect(Number(initial.value)).toBeCloseTo(1, 5);
      expect(convertToBaseValue(`${initial.value}${initial.unit}`)).toBe(1073741824);
    });

    it('humanizes decimal SI units without undershooting the current request', () => {
      const bytes = convertToBaseValue('2G') as number;
      const initial = getInitialExpandSize('2G');
      expect(initial.unit).toBe('Gi');
      const reconstituted = convertToBaseValue(`${initial.value}${initial.unit}`);
      expect(reconstituted).not.toBeNull();
      expect(reconstituted as number).toBeGreaterThanOrEqual(bytes);
    });

    it('still humanizes odd Mi sizes into Gi for display consistency', () => {
      const initial = getInitialExpandSize('1591Mi');
      expect(initial.unit).toBe('Gi');
      const bytes = convertToBaseValue('1591Mi') as number;
      const reconstituted = convertToBaseValue(`${initial.value}${initial.unit}`);
      expect(reconstituted).not.toBeNull();
      expect(reconstituted as number).toBeGreaterThanOrEqual(bytes);
    });
  });

  describe('getMinValueInSelectedUnit', () => {
    it('converts min bytes into the selected unit for the spinner', () => {
      const minBytes = convertToBaseValue('1591Mi') as number;
      expect(getMinValueInSelectedUnit(minBytes, 'Mi')).toBeCloseTo(1591, 5);
      expect(getMinValueInSelectedUnit(minBytes, 'Gi')).toBeCloseTo(1591 / 1024, 5);
    });
  });

  describe('isExpandSizeValid', () => {
    it('allows sizes greater than or equal to the current request', () => {
      const minBytes = convertToBaseValue('1Gi') as number;
      expect(isExpandSizeValid(1, 'Gi', minBytes)).toBe(true);
      expect(isExpandSizeValid(2, 'Gi', minBytes)).toBe(true);
      expect(isExpandSizeValid(1024, 'Mi', minBytes)).toBe(true);
    });

    it('rejects sizes below the current request', () => {
      const minBytes = convertToBaseValue('2Gi') as number;
      expect(isExpandSizeValid(1, 'Gi', minBytes)).toBe(false);
      expect(isExpandSizeValid(1.5, 'Gi', minBytes)).toBe(false);
    });

    it('treats the humanized 1536Mi initial size as valid', () => {
      const minBytes = convertToBaseValue('1536Mi') as number;
      const initial = getInitialExpandSize('1536Mi');
      expect(isExpandSizeValid(initial.value, initial.unit, minBytes)).toBe(true);
    });
  });
});
