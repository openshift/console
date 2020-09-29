import { getRandomChars } from '@console/shared/src/utils/utils';
import { toTitleCase } from '../utils';

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

  describe('toTitleCase', () => {
    it('Converts string to titleCase correctly', () => {
      expect(toTitleCase('ibm-b2bi-prod')).toBe('Ibm B2bi Prod');
      expect(toTitleCase('IBM-b2BI-prod')).toBe('IBM B2BI Prod');
      expect(toTitleCase('ibm-b2bi-prod--ibm-helm-catalog')).toBe(
        'Ibm B2bi Prod  Ibm Helm Catalog',
      );
    });
  });
});
