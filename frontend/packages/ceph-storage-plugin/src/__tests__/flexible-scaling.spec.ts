import { isFlexibleScaling } from '../utils/install';

describe('isFlexibleScaling', () => {
  describe('for 0 AZ', () => {
    it('return truthy with 3 nodes', () => {
      expect(isFlexibleScaling(3, 0)).toBe(true);
    });
    it('return truthy with more than 3 nodes', () => {
      expect(isFlexibleScaling(4, 0)).toBe(true);
    });
    it('return falsy with less than 3 nodes', () => {
      expect(isFlexibleScaling(2, 0)).toBe(false);
    });
    it('return falsy with 0 nodes', () => {
      expect(isFlexibleScaling(0, 0)).toBe(false);
    });
  });

  describe('for 1 AZ', () => {
    it('return truthy with 3 nodes', () => {
      expect(isFlexibleScaling(3, 1)).toBe(true);
    });
    it('return truthy with more than 3 nodes', () => {
      expect(isFlexibleScaling(4, 1)).toBe(true);
    });
    it('return falsy with less than 3 nodes', () => {
      expect(isFlexibleScaling(2, 1)).toBe(false);
    });
    it('return falsy with 0 nodes', () => {
      expect(isFlexibleScaling(0, 1)).toBe(false);
    });
  });

  describe('for 2 AZ', () => {
    it('return truthy with 3 nodes', () => {
      expect(isFlexibleScaling(3, 2)).toBe(true);
    });
    it('return truthy with more than 3 nodes', () => {
      expect(isFlexibleScaling(4, 2)).toBe(true);
    });
    it('return falsy with less than 3 nodes', () => {
      expect(isFlexibleScaling(2, 2)).toBe(false);
    });
    it('return falsy with 0 nodes', () => {
      expect(isFlexibleScaling(0, 2)).toBe(false);
    });
  });

  describe('for 3 AZ', () => {
    it('returns falsy with 3 nodes', () => {
      expect(isFlexibleScaling(3, 3)).toBe(false);
    });
    it('return falsy with more than 3 nodes', () => {
      expect(isFlexibleScaling(4, 3)).toBe(false);
    });
    it('return falsy with less than 3 nodes', () => {
      expect(isFlexibleScaling(2, 3)).toBe(false);
    });
    it('return falsy with 0 nodes', () => {
      expect(isFlexibleScaling(0, 3)).toBe(false);
    });
  });
});
