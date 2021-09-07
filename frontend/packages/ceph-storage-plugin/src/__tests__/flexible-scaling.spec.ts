import { isFlexibleScaling } from '../utils/install';

describe('isFlexibleScaling', () => {
  describe('for 0 AZ', () => {
    it('return falsy when a no-provisioner storage class is passed', () => {
      expect(isFlexibleScaling(3, 0, false)).toBe(false);
    });
    it('return truthy with 3 nodes', () => {
      expect(isFlexibleScaling(3, 0, true)).toBe(true);
    });
    it('return truthy with more than 3 nodes', () => {
      expect(isFlexibleScaling(4, 0, true)).toBe(true);
    });
    it('return falsy with less than 3 nodes', () => {
      expect(isFlexibleScaling(2, 0, true)).toBe(false);
    });
    it('return falsy with 0 nodes', () => {
      expect(isFlexibleScaling(0, 0, true)).toBe(false);
    });
  });

  describe('for 1 AZ', () => {
    it('return falsy when a no-provisioner storage class is passed', () => {
      expect(isFlexibleScaling(3, 1, false)).toBe(false);
    });
    it('return truthy with 3 nodes', () => {
      expect(isFlexibleScaling(3, 1, true)).toBe(true);
    });
    it('return truthy with more than 3 nodes', () => {
      expect(isFlexibleScaling(4, 1, true)).toBe(true);
    });
    it('return falsy with less than 3 nodes', () => {
      expect(isFlexibleScaling(2, 1, true)).toBe(false);
    });
    it('return falsy with 0 nodes', () => {
      expect(isFlexibleScaling(0, 1, true)).toBe(false);
    });
  });

  describe('for 2 AZ', () => {
    it('return falsy when a no-provisioner storage class is passed', () => {
      expect(isFlexibleScaling(3, 2, false)).toBe(false);
    });
    it('return truthy with 3 nodes', () => {
      expect(isFlexibleScaling(3, 2, true)).toBe(true);
    });
    it('return truthy with more than 3 nodes', () => {
      expect(isFlexibleScaling(4, 2, true)).toBe(true);
    });
    it('return falsy with less than 3 nodes', () => {
      expect(isFlexibleScaling(2, 2, true)).toBe(false);
    });
    it('return falsy with 0 nodes', () => {
      expect(isFlexibleScaling(0, 2, true)).toBe(false);
    });
  });

  describe('for 3 AZ', () => {
    it('return falsy when a no-provisioner storage class is passed', () => {
      expect(isFlexibleScaling(3, 3, false)).toBe(false);
    });
    it('returns falsy with 3 nodes', () => {
      expect(isFlexibleScaling(3, 3, true)).toBe(false);
    });
    it('return falsy with more than 3 nodes', () => {
      expect(isFlexibleScaling(4, 3, true)).toBe(false);
    });
    it('return falsy with less than 3 nodes', () => {
      expect(isFlexibleScaling(2, 3, true)).toBe(false);
    });
    it('return falsy with 0 nodes', () => {
      expect(isFlexibleScaling(0, 3, true)).toBe(false);
    });
  });
});
