import { getRandomChars } from '@console/shared/src/utils/utils';

describe('Utils', () => {
  describe('getRandomCharacters', () => {
    it('should return 2 digit random alphanumeric characters', () => {
      const randomOutput = getRandomChars(2);
      expect(randomOutput).toHaveLength(2);
    });
    it('should return 6 digit random alphanumeric characters for no input', () => {
      const randomOutput = getRandomChars();
      expect(randomOutput).toHaveLength(6);
    });
  });
});
